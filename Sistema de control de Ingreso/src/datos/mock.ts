// src/datos/mock.ts
export type TicketType = { id:string; name:string; price:number; quota:number };
export type Event = {
  id:string; name:string; date:string; venue:string; banner?:string;
  description:string; ticketTypes:TicketType[];
};

export const eventsMock: Event[] = [
  {
    id:"ev1",
    name:"Festival Cultural Amazónico",
    date:"2025-11-20 18:00",
    venue:"Malecón – Plaza Principal",
    banner:"https://picsum.photos/seed/amazonia/1200/500",
    description:"Música, danza, gastronomía y artesanías de la selva. Ven con tu familia.",
    ticketTypes:[
      {id:"t1", name:"General", price:25, quota:300},
      {id:"t2", name:"VIP", price:60, quota:80},
    ]
  },
  {
    id:"ev2",
    name:"Noche de Danzas Regionales",
    date:"2025-12-05 19:30",
    venue:"Teatro Municipal",
    banner:"https://picsum.photos/seed/danza/1200/500",
    description:"Show con agrupaciones invitadas y ensamble de música en vivo.",
    ticketTypes:[
      {id:"t1", name:"Platea", price:35, quota:200},
      {id:"t2", name:"Palco", price:70, quota:50},
    ]
  }
];

export const money = (n:number) => `S/. ${n.toFixed(2)}`;
