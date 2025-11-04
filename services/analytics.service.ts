import { supabase } from '@/lib/supabase';

export interface SalesByCategory {
  name: string;
  total: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

export interface NewUsersData {
  labels: string[];
  datasets: {
    data: number[];
  }[];
}

export interface TicketValidationData {
    name: string;
    count: number;
    color: string;
}

const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

export const getSalesByCategory = async (): Promise<SalesByCategory[]> => {
  const { data, error } = await supabase.rpc('get_sales_by_category');

  if (error) {
    console.error('Error fetching sales by category:', error);
    throw new Error(error.message);
  }

  return data.map((item: { category: string; total_sales: number }, index: number) => ({
    name: item.category,
    total: item.total_sales,
    color: COLORS[index % COLORS.length],
    legendFontColor: '#7F7F7F',
    legendFontSize: 15,
  }));
};

export const getNewUsersOverTime = async (): Promise<NewUsersData> => {
    const { data, error } = await supabase.rpc('get_new_users_over_time');

    if (error) {
        console.error('Error fetching new users over time:', error);
        throw new Error(error.message);
    }

    const labels = data.map((item: { date: string; count: number }) => item.date);
    const counts = data.map((item: { date: string; count: number }) => item.count);

    return {
        labels,
        datasets: [
            {
                data: counts,
            },
        ],
    };
};

export const getTicketValidationStatus = async (): Promise<TicketValidationData[]> => {
    const { data, error } = await supabase.rpc('get_ticket_validation_status');

    if (error) {
        console.error('Error fetching ticket validation status:', error);
        throw new Error(error.message);
    }

    return data.map((item: { status: string; count: number }, index: number) => ({
        name: item.status,
        count: item.count,
        color: COLORS[index % COLORS.length],
    }));
};
