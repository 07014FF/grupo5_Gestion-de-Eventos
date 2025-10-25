# 🇵🇪 Pasarelas de Pago para Perú

## 🏆 Comparación de Pasarelas en Perú

### 1. **Culqi** - ⭐ RECOMENDADA

**Por qué es la mejor:**
- 🇵🇪 Empresa peruana (conocen el mercado local)
- 💰 Comisión más baja: **3.79% + S/0.30**
- 💳 Acepta: Visa, Mastercard, Amex, Diners
- 📱 **Yape integrado** (billetera digital más usada en Perú)
- 🔒 Certificación PCI DSS Level 1
- 📊 Dashboard en español
- 🚀 API moderna y bien documentada
- ⚡ Aprobación instantánea de cuenta

**Métodos de pago soportados:**
- Tarjetas de crédito/débito
- **Yape** (crucial en Perú)
- Pagos recurrentes
- Link de pago

**Costos:**
- Transacción exitosa: 3.79% + S/0.30
- Sin cuota mensual
- Sin setup fee
- Contracargos: S/35

**Documentación:**
- https://docs.culqi.com/

---

### 2. **Niubiz (Visa Net Perú)**

**Ventajas:**
- Respaldo de Visa
- Muy estable
- Preferida por empresas grandes

**Desventajas:**
- Comisión: 3.5-4% (varía según volumen)
- Proceso de aprobación más largo
- API menos moderna
- Requiere certificación PCI

**Mejor para:**
- Empresas establecidas
- Alto volumen de transacciones
- Necesitas soporte enterprise

---

### 3. **Mercado Pago**

**Ventajas:**
- Muy conocida en LatAm
- Pagos en cuotas sin interés
- Usuarios tienen billetera

**Desventajas:**
- Comisión más alta: 3.99%
- Menos enfocada en Perú específicamente
- No tiene Yape

**Mejor para:**
- E-commerce
- Ventas en varios países de LatAm

---

### 4. **Izipay (ex Lyra Perú)**

**Ventajas:**
- Bancos locales integrados
- Buena para suscripciones

**Desventajas:**
- Comisión: ~4%
- API más compleja
- Menos documentación

---

### 5. **PayU Latam**

**Ventajas:**
- Presente en varios países
- Soporte de efectivo (agentes)

**Desventajas:**
- Comisión: 3.99% + costos
- UX no tan buena
- API antigua

---

## 🎯 Recomendación Final para Perú

### Para tu app de venta de tickets:

**1ra Opción: Culqi + Yape** ✅
```
✅ Costos más bajos
✅ Yape integrado (90% de peruanos lo usan)
✅ API moderna
✅ Rápido de implementar
✅ Dashboard intuitivo
```

**2da Opción: Niubiz**
```
Solo si:
- Eres empresa constituida
- Esperas alto volumen (>S/100k/mes)
- Necesitas soporte enterprise
```

---

## 💡 Estrategia Recomendada

**Fase MVP:**
- Culqi con Yape
- Costo bajo, implementación rápida

**Si creces:**
- Negociar comisiones con Culqi
- O agregar Niubiz en paralelo

**Si vas internacional:**
- Agregar Stripe para otros países
- Mantener Culqi para Perú

---

## 📊 Tabla Comparativa

| Pasarela | Comisión | Yape | Tarjetas | Tiempo Setup | API |
|----------|----------|------|----------|--------------|-----|
| **Culqi** | 3.79% | ✅ | ✅ | 1-2 días | ⭐⭐⭐⭐⭐ |
| **Niubiz** | 3.5-4% | ❌ | ✅ | 1-2 semanas | ⭐⭐⭐ |
| **MercadoPago** | 3.99% | ❌ | ✅ | 2-3 días | ⭐⭐⭐⭐ |
| **Izipay** | ~4% | ❌ | ✅ | 3-5 días | ⭐⭐⭐ |

---

## 🚀 Implementación Elegida: CULQI

He implementado Culqi porque:
1. Es la más económica
2. Tiene Yape (esencial en Perú)
3. API excelente
4. Setup rápido
5. Empresa peruana que entiende el mercado local

Ver implementación en: `services/payment.service.ts`
