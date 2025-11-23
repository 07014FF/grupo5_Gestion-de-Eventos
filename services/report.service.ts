import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { AdminService, EventStatistics, SalesReport, DashboardMetrics } from './admin.service';
import { Result, handleError } from '@/utils/errors';

interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  pendingValidations: number;
  todaysSales: number;
}

interface RecentPurchase {
  id: string;
  event_title: string;
  user_name: string;
  total_amount: number;
  created_at: string;
  payment_status: string;
}

export class ReportService {
  /**
   * Generate and export PDF report
   */
  static async exportToPDF(
    stats: DashboardStats,
    purchases: RecentPurchase[],
    weeklyRevenue: number[]
  ): Promise<void> {
    try {
      const html = this.generateHTMLReport(stats, purchases, weeklyRevenue);

      const { uri } = await Print.printToFileAsync({ html });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Exportar Reporte PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert(
          'Reporte Generado',
          `El reporte se guardó en: ${uri}`
        );
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      Alert.alert('Error', 'No se pudo generar el reporte PDF');
    }
  }

  /**
   * Generate and export CSV report
   */
  static async exportToCSV(purchases: RecentPurchase[]): Promise<void> {
    try {
      const csv = this.generateCSVReport(purchases);

      // Create a simple HTML file with CSV content for download
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Reporte CSV</title>
          </head>
          <body>
            <pre>${csv}</pre>
            <script>
              // Download CSV
              const csv = \`${csv}\`;
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'reporte_${new Date().toISOString().split('T')[0]}.csv';
              a.click();
            </script>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar Reporte CSV',
        });
      }

      Alert.alert(
        'Exportado',
        'El reporte CSV ha sido generado. Puedes compartirlo o guardarlo.'
      );
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      Alert.alert('Error', 'No se pudo generar el reporte CSV');
    }
  }

  /**
   * Generate HTML for PDF report
   */
  private static generateHTMLReport(
    stats: DashboardStats,
    purchases: RecentPurchase[],
    weeklyRevenue: number[]
  ): string {
    const currentDate = new Date().toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const totalWeeklyRevenue = weeklyRevenue.reduce((sum, val) => sum + val, 0);

    return `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <title>Reporte de Ventas - ${currentDate}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              padding: 40px;
              background: #fff;
              color: #1a1a1a;
            }

            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 3px solid #00D084;
            }

            .header h1 {
              font-size: 32px;
              color: #00D084;
              margin-bottom: 10px;
            }

            .header p {
              font-size: 16px;
              color: #666;
            }

            .stats-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-bottom: 40px;
            }

            .stat-card {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 12px;
              border-left: 4px solid #00D084;
            }

            .stat-label {
              font-size: 14px;
              color: #666;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .stat-value {
              font-size: 28px;
              font-weight: 700;
              color: #1a1a1a;
            }

            .section {
              margin-bottom: 40px;
            }

            .section-title {
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 20px;
              color: #1a1a1a;
              border-bottom: 2px solid #e0e0e0;
              padding-bottom: 10px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }

            th {
              background: #00D084;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
              font-size: 14px;
            }

            td {
              padding: 12px;
              border-bottom: 1px solid #e0e0e0;
              font-size: 14px;
            }

            tr:hover {
              background: #f8f9fa;
            }

            .status-badge {
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
            }

            .status-completed {
              background: #d1fae5;
              color: #065f46;
            }

            .status-pending {
              background: #fef3c7;
              color: #92400e;
            }

            .footer {
              margin-top: 60px;
              padding-top: 20px;
              border-top: 2px solid #e0e0e0;
              text-align: center;
              color: #666;
              font-size: 12px;
            }

            .weekly-chart {
              margin: 20px 0;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 12px;
            }

            .chart-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 0;
              border-bottom: 1px solid #e0e0e0;
            }

            .chart-label {
              font-weight: 600;
              color: #666;
            }

            .chart-value {
              font-weight: 700;
              color: #00D084;
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header">
            <h1>📊 Reporte de Ventas</h1>
            <p>Generado el ${currentDate}</p>
          </div>

          <!-- Statistics Grid -->
          <div class="section">
            <h2 class="section-title">Resumen Ejecutivo</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Eventos</div>
                <div class="stat-value">${stats.totalEvents}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Eventos Activos</div>
                <div class="stat-value">${stats.activeEvents}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Tickets Vendidos</div>
                <div class="stat-value">${stats.totalTicketsSold}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Ingresos Totales</div>
                <div class="stat-value">S/ ${stats.totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Ventas de Hoy</div>
                <div class="stat-value">S/ ${stats.todaysSales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Pendientes</div>
                <div class="stat-value">${stats.pendingValidations}</div>
              </div>
            </div>
          </div>

          <!-- Weekly Revenue -->
          <div class="section">
            <h2 class="section-title">Ingresos Semanales</h2>
            <div class="weekly-chart">
              ${['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
                .map((day, index) => `
                  <div class="chart-row">
                    <span class="chart-label">${day}</span>
                    <span class="chart-value">S/ ${(weeklyRevenue[index] || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                  </div>
                `)
                .join('')}
              <div class="chart-row" style="border-top: 2px solid #00D084; margin-top: 10px; padding-top: 10px;">
                <span class="chart-label"><strong>Total Semana</strong></span>
                <span class="chart-value"><strong>S/ ${totalWeeklyRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong></span>
              </div>
            </div>
          </div>

          <!-- Recent Purchases Table -->
          <div class="section">
            <h2 class="section-title">Últimas Transacciones</h2>
            <table>
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Cliente</th>
                  <th>Monto</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${purchases.slice(0, 20).map(purchase => `
                  <tr>
                    <td>${purchase.event_title}</td>
                    <td>${purchase.user_name}</td>
                    <td><strong>S/ ${purchase.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong></td>
                    <td>${new Date(purchase.created_at).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</td>
                    <td>
                      <span class="status-badge status-${purchase.payment_status === 'completed' ? 'completed' : 'pending'}">
                        ${purchase.payment_status === 'completed' ? 'Completado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Este reporte fue generado automáticamente por el sistema de gestión de eventos.</p>
            <p>© ${new Date().getFullYear()} Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate CSV report
   */
  private static generateCSVReport(purchases: RecentPurchase[]): string {
    const headers = ['ID', 'Evento', 'Cliente', 'Monto', 'Fecha', 'Estado'];
    const rows = purchases.map(p => [
      p.id,
      `"${p.event_title}"`,
      `"${p.user_name}"`,
      p.total_amount.toFixed(2),
      new Date(p.created_at).toISOString(),
      p.payment_status,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Generate simple text report (for sharing)
   */
  static generateTextReport(stats: DashboardStats): string {
    const currentDate = new Date().toLocaleDateString('es-PE');

    return `
📊 REPORTE DE VENTAS - ${currentDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 RESUMEN EJECUTIVO:

🎫 Total Eventos: ${stats.totalEvents}
✅ Eventos Activos: ${stats.activeEvents}
🎟️ Tickets Vendidos: ${stats.totalTicketsSold}
💰 Ingresos Totales: S/ ${stats.totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
📅 Ventas de Hoy: S/ ${stats.todaysSales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
⏳ Pendientes: ${stats.pendingValidations}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generado automáticamente por el sistema.
    `.trim();
  }

  /**
   * Exporta reporte de ventas en formato CSV (compatible con Excel)
   */
  static async exportSalesReportCSV(
    userId: string,
    userRole: string,
    startDate?: string,
    endDate?: string
  ): Promise<Result<void>> {
    try {
      const salesResult = await AdminService.getSalesReport(userId, userRole, startDate, endDate);

      if (!salesResult.success) {
        throw salesResult.error;
      }

      const salesData = salesResult.data;
      const csv = this.generateSalesCSV(salesData);
      const fileName = `ventas_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar Reporte de Ventas',
        });
      }

      return { success: true, data: undefined };
    } catch (error) {
      return handleError(error, 'ReportService.exportSalesReportCSV');
    }
  }

  /**
   * Exporta estadísticas de eventos en formato CSV
   */
  static async exportEventStatisticsCSV(
    userId: string,
    userRole: string
  ): Promise<Result<void>> {
    try {
      const statsResult = await AdminService.getEventStatistics(userId, userRole);

      if (!statsResult.success) {
        throw statsResult.error;
      }

      const eventStats = statsResult.data;
      const csv = this.generateEventStatsCSV(eventStats);
      const fileName = `estadisticas_eventos_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar Estadísticas de Eventos',
        });
      }

      return { success: true, data: undefined };
    } catch (error) {
      return handleError(error, 'ReportService.exportEventStatisticsCSV');
    }
  }

  /**
   * Exporta reporte completo en formato CSV con todas las métricas
   */
  static async exportCompleteReportCSV(
    userId: string,
    userRole: string
  ): Promise<Result<void>> {
    try {
      const metricsResult = await AdminService.getDashboardMetrics(userId, userRole);
      const statsResult = await AdminService.getEventStatistics(userId, userRole);
      const salesResult = await AdminService.getSalesReport(userId, userRole);

      if (!metricsResult.success || !statsResult.success || !salesResult.success) {
        throw new Error('Error al obtener datos para el reporte');
      }

      const metrics = metricsResult.data;
      const eventStats = statsResult.data;
      const salesData = salesResult.data;

      const BOM = '\uFEFF';
      let csvContent = '';

      csvContent += 'RESUMEN GENERAL\n';
      csvContent += 'Métrica,Valor\n';
      csvContent += `Total de Eventos,${metrics.totalEvents}\n`;
      csvContent += `Eventos Activos,${metrics.activeEvents}\n`;
      csvContent += `Total de Ventas,${metrics.totalSales}\n`;
      csvContent += `Ingresos Totales (S/),${metrics.totalRevenue.toFixed(2)}\n`;

      if (userRole === 'super_admin') {
        csvContent += `Total de Usuarios,${metrics.totalUsers}\n`;
        csvContent += `Total de Validadores,${metrics.totalValidators}\n`;
      }

      csvContent += '\n\n';

      csvContent += 'ESTADÍSTICAS POR EVENTO\n';
      csvContent +=
        'Evento,Tickets Vendidos,Ingresos (S/),Disponibles,Validados,Tasa Validación (%)\n';

      eventStats.forEach((stat) => {
        csvContent += `"${stat.eventTitle}",${stat.totalTicketsSold},${stat.revenue.toFixed(
          2
        )},${stat.availableTickets},${stat.validatedTickets},${stat.validationRate.toFixed(2)}\n`;
      });

      csvContent += '\n\n';

      csvContent += 'DETALLE DE VENTAS\n';
      csvContent += 'Fecha,Evento,Tickets,Ingresos (S/),Método de Pago\n';

      salesData.forEach((sale) => {
        csvContent += `${new Date(sale.date).toLocaleString('es-PE')},"${
          sale.eventTitle
        }",${sale.ticketsSold},${sale.revenue.toFixed(2)},${sale.paymentMethod}\n`;
      });

      const fileName = `reporte_completo_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, BOM + csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar Reporte Completo',
        });
      }

      return { success: true, data: undefined };
    } catch (error) {
      return handleError(error, 'ReportService.exportCompleteReportCSV');
    }
  }

  private static generateSalesCSV(salesData: SalesReport[]): string {
    const headers = ['Fecha', 'Evento', 'Tickets Vendidos', 'Ingresos (S/)', 'Método de Pago'];
    const rows = salesData.map((sale) => [
      new Date(sale.date).toLocaleString('es-PE'),
      `"${sale.eventTitle}"`,
      sale.ticketsSold.toString(),
      sale.revenue.toFixed(2),
      sale.paymentMethod,
    ]);

    const BOM = '\uFEFF';
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    return BOM + csvContent;
  }

  private static generateEventStatsCSV(eventStats: EventStatistics[]): string {
    const headers = [
      'Evento',
      'Tickets Vendidos',
      'Ingresos (S/)',
      'Tickets Disponibles',
      'Tickets Validados',
      'Tasa de Validación (%)',
    ];

    const rows = eventStats.map((stat) => [
      `"${stat.eventTitle}"`,
      stat.totalTicketsSold.toString(),
      stat.revenue.toFixed(2),
      stat.availableTickets.toString(),
      stat.validatedTickets.toString(),
      stat.validationRate.toFixed(2),
    ]);

    const BOM = '\uFEFF';
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    return BOM + csvContent;
  }
}
