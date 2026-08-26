import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, User, AppConfig } from '../types';
import { formatCurrency } from '../lib/utils';

export function generateChefStatementPDF(
  chef: User, 
  chefOrders: Order[], 
  config?: AppConfig | null, 
  dateRange?: { start?: string; end?: string }
) {
  const doc = new jsPDF();

  // Primary Colors
  const brandRed = [227, 30, 36] as [number, number, number];
  const darkGray = [33, 37, 41] as [number, number, number];
  const lightBg = [248, 249, 250] as [number, number, number];

  // Header Banner
  doc.setFillColor(...brandRed);
  doc.rect(0, 0, 210, 36, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('HC HOME COOKING SERVICES', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Lucknow, Uttar Pradesh | Official Chef Earnings & Mission Statement', 14, 26);
  if (config?.contactPhone) {
    doc.text(`Helpline: ${config.contactPhone} | Email: ${config.contactEmail || 'hchomecookingservices@gmail.com'}`, 14, 31);
  }

  // Statement Meta Header
  doc.setFillColor(...lightBg);
  doc.roundedRect(14, 42, 182, 34, 3, 3, 'F');

  doc.setTextColor(...darkGray);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`CHEF STATEMENT: ${chef.name.toUpperCase()} ${chef.surname ? chef.surname.toUpperCase() : ''}`, 18, 51);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Chef ID: #${chef.id}`, 18, 58);
  doc.text(`Phone: ${chef.phone || chef.whatsapp || 'N/A'}`, 18, 64);
  doc.text(`Email: ${chef.email || 'N/A'}`, 18, 70);

  const totalGross = chefOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalChefShare = chefOrders.reduce((sum, o) => sum + (o.commissionChef || Math.round((o.totalAmount || 0) * 0.7)), 0);
  const totalAdminCut = chefOrders.reduce((sum, o) => sum + (o.commissionAdmin || Math.round((o.totalAmount || 0) * 0.3)), 0);
  const totalMinutes = chefOrders.reduce((sum, o) => sum + (o.durationMinutes || Math.ceil((o.durationSeconds || 0) / 60) || 0), 0);

  doc.text(`Generated On: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 110, 58);
  doc.text(`Period: ${dateRange?.start || 'All Time'} to ${dateRange?.end || 'Present'}`, 110, 64);
  doc.text(`Total Missions: ${chefOrders.length} Completed`, 110, 70);

  // Financial Summary Cards
  const cardY = 82;
  const cardWidth = 43;
  const cardHeight = 22;

  // Card 1: Gross
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(14, cardY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('TOTAL GROSS BILLED', 17, cardY + 7);
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(`INR ${totalGross.toLocaleString('en-IN')}`, 17, cardY + 16);

  // Card 2: Chef Net Earnings
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(60, cardY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(5, 150, 105);
  doc.text('NET CHEF EARNINGS (70%)', 63, cardY + 7);
  doc.setFontSize(11);
  doc.setTextColor(4, 120, 87);
  doc.text(`INR ${totalChefShare.toLocaleString('en-IN')}`, 63, cardY + 16);

  // Card 3: Platform Fee
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(106, cardY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(220, 38, 38);
  doc.text('PLATFORM SHARE (30%)', 109, cardY + 7);
  doc.setFontSize(11);
  doc.setTextColor(185, 28, 28);
  doc.text(`INR ${totalAdminCut.toLocaleString('en-IN')}`, 109, cardY + 16);

  // Card 4: Cooking Hours
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(152, cardY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text('COOKING TIME LOGGED', 155, cardY + 7);
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(`${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`, 155, cardY + 16);

  // Missions Table
  const tableData = chefOrders.map(o => [
    `#${o.bookingId || o.id.slice(-6).toUpperCase()}`,
    new Date(o.createdAt).toLocaleDateString(),
    o.type || 'DAILY',
    o.userName || o.userEmail?.split('@')[0] || 'Customer',
    `${o.durationMinutes || Math.ceil((o.durationSeconds || 0) / 60) || 0}m`,
    `INR ${o.totalAmount || 0}`,
    `INR ${o.commissionChef || Math.round((o.totalAmount || 0) * 0.7)}`,
    o.paymentMethod || (o.status === 'PAID' ? 'ONLINE' : o.status),
    o.rating ? `${o.rating}★` : 'N/A'
  ]);

  autoTable(doc, {
    startY: 110,
    head: [['Booking', 'Date', 'Type', 'Customer', 'Duration', 'Gross Bill', 'Chef Net', 'Payment', 'Rating']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: brandRed,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [33, 37, 41]
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'left' },
      4: { halign: 'center' },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { halign: 'right', fontStyle: 'bold', textColor: [4, 120, 87] },
      7: { halign: 'center' },
      8: { halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });

  // Footer & Disclaimer
  const finalY = (doc as any).lastAutoTable?.finalY || 240;
  if (finalY < 260) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(156, 163, 175);
    doc.text('This is a system-generated statement issued by HC Home Cooking Services Platform, Lucknow.', 14, finalY + 12);
    doc.text('For payout queries or discrepancies, please contact partner support or email hchomecookingservices@gmail.com', 14, finalY + 17);
  }

  // Save File
  const filename = `Chef_Statement_${chef.name.replace(/\s+/g, '_')}_${chef.id}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

export function generateInvoicePDF(order: Order, config?: AppConfig | null) {
  const doc = new jsPDF();

  const brandRed = [227, 30, 36] as [number, number, number];
  const darkGray = [33, 37, 41] as [number, number, number];

  // Header Bar
  doc.setFillColor(...brandRed);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('HC HOME COOKING SERVICES', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Premium Home Chef & Veg Cooking Solutions | Lucknow, UP', 14, 23);

  // Invoice Title
  doc.setTextColor(...darkGray);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICE INVOICE & RECEIPT', 14, 46);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No: INV-${order.bookingId || order.id.slice(-8).toUpperCase()}`, 14, 53);
  doc.text(`Booking Ref: #${order.bookingId || order.id}`, 14, 59);
  doc.text(`Date & Time: ${new Date(order.createdAt).toLocaleString()}`, 14, 65);

  // Status Badge
  doc.setFillColor(order.status === 'PAID' ? 220 : 254, order.status === 'PAID' ? 252 : 243, order.status === 'PAID' ? 231 : 199);
  doc.roundedRect(140, 40, 56, 26, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(order.status === 'PAID' ? 22 : 180, order.status === 'PAID' ? 101 : 83, order.status === 'PAID' ? 52 : 9);
  doc.text(`STATUS: ${order.status}`, 146, 52);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mode: ${order.paymentMethod || 'ONLINE / PHONEPE'}`, 146, 60);

  // Bill To & Service Details Boxes
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(14, 74, 88, 38, 2, 2, 'F');
  doc.roundedRect(108, 74, 88, 38, 2, 2, 'F');

  // Customer Box
  doc.setTextColor(...darkGray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER DETAILS', 18, 82);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Name: ${order.userName || 'Valued Customer'}`, 18, 89);
  doc.text(`Phone: ${order.userPhone || 'N/A'}`, 18, 95);
  doc.text(`Address: ${order.address || 'Lucknow Residence'}`, 18, 101, { maxWidth: 80 });

  // Chef Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ASSIGNED CHEF PARTNER', 112, 82);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Chef Name: ${order.chefName || 'Assigned HC Chef'}`, 112, 89);
  doc.text(`Chef Phone: ${order.chefPhone || 'N/A'}`, 112, 95);
  doc.text(`Service Type: ${order.type === 'PARTY' ? 'Party / Bulk Cooking' : 'Daily Home Veg Cooking'}`, 112, 101);

  // Items / Duration Table
  const durationMins = order.durationMinutes || Math.ceil((order.durationSeconds || 0) / 60) || 0;
  const ratePerMin = order.ratePerMin || 3;

  const items = [
    [
      `Chef Cooking Session (${order.type || 'DAILY'})`,
      `${durationMins} Minutes`,
      `INR ${ratePerMin}/min`,
      `INR ${order.totalAmount || 0}`
    ]
  ];

  if (order.dishes && order.dishes.length > 0) {
    items.push([
      `Dishes Prepared: ${order.dishes.map(d => typeof d === 'string' ? d : d.name).join(', ')}`,
      '-',
      'Included',
      'INR 0'
    ]);
  }

  autoTable(doc, {
    startY: 120,
    head: [['Description', 'Duration / Qty', 'Rate', 'Amount']],
    body: items,
    theme: 'grid',
    headStyles: {
      fillColor: brandRed,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [33, 37, 41]
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'right', fontStyle: 'bold' }
    }
  });

  const finalTableY = (doc as any).lastAutoTable?.finalY || 160;

  // Grand Total Box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(120, finalTableY + 8, 76, 24, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('TOTAL AMOUNT PAID', 124, finalTableY + 16);
  doc.setFontSize(14);
  doc.setTextColor(227, 30, 36);
  doc.text(`INR ${(order.totalAmount || 0).toLocaleString('en-IN')}`, 124, finalTableY + 26);

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(156, 163, 175);
  doc.text('Thank you for choosing HC Home Cooking Services.', 14, finalTableY + 45);
  doc.text('For support or queries, contact us at hchomecookingservices@gmail.com or call +91 8543898295.', 14, finalTableY + 50);

  const filename = `Invoice_${order.bookingId || order.id.slice(-6).toUpperCase()}.pdf`;
  doc.save(filename);
}

export function generateExecutiveReportPDF(
  orders: Order[],
  chefs: User[],
  config: AppConfig | null,
  kpis: {
    totalGross: number;
    adminCut: number;
    chefEarnings: number;
    completedOrders: number;
  }
) {
  const doc = new jsPDF();
  const brandRed = [227, 30, 36] as [number, number, number];

  // Header Banner
  doc.setFillColor(...brandRed);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('HC HOME COOKING SERVICES', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Executive Analytics, Heatmap & Operational Performance Report', 14, 24);
  doc.text(`Generated On: ${new Date().toLocaleString()} | Lucknow Headquarters`, 14, 30);

  // KPI Section
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(14, 44, 182, 30, 3, 3, 'F');

  doc.setTextColor(33, 37, 41);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL GROSS TURNOVER', 18, 54);
  doc.setFontSize(12);
  doc.text(`INR ${kpis.totalGross.toLocaleString('en-IN')}`, 18, 65);

  doc.setFontSize(8);
  doc.setTextColor(220, 38, 38);
  doc.text('PLATFORM PROFIT (30%)', 65, 54);
  doc.setFontSize(12);
  doc.text(`INR ${kpis.adminCut.toLocaleString('en-IN')}`, 65, 65);

  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text('CHEF DISBURSALS (70%)', 115, 54);
  doc.setFontSize(12);
  doc.text(`INR ${kpis.chefEarnings.toLocaleString('en-IN')}`, 115, 65);

  doc.setFontSize(8);
  doc.setTextColor(79, 70, 229);
  doc.text('ACTIVE CHEF PARTNERS', 160, 54);
  doc.setFontSize(12);
  doc.text(`${chefs.length} Registered`, 160, 65);

  // Top Chef Performers Table
  const chefStats = chefs.map(c => {
    const cOrders = orders.filter(o => o.chefId === c.id);
    const gross = cOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const net = cOrders.reduce((sum, o) => sum + (o.commissionChef || Math.round((o.totalAmount || 0) * 0.7)), 0);
    const avgRating = cOrders.filter(o => o.rating).length > 0 
      ? (cOrders.reduce((sum, o) => sum + (o.rating || 0), 0) / cOrders.filter(o => o.rating).length).toFixed(1) 
      : '5.0';
    return [
      c.name + ' ' + (c.surname || ''),
      `#${c.id}`,
      `${cOrders.length} Missions`,
      `INR ${gross.toLocaleString('en-IN')}`,
      `INR ${net.toLocaleString('en-IN')}`,
      `${avgRating}★`
    ];
  });

  autoTable(doc, {
    startY: 82,
    head: [['Chef Partner', 'ID', 'Completed Bookings', 'Gross Generated', 'Chef Earnings', 'Avg Rating']],
    body: chefStats,
    theme: 'striped',
    headStyles: {
      fillColor: brandRed,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 8
    }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 160;

  // Recent Transactions
  const recentOrders = orders.slice(-15).reverse().map(o => [
    `#${o.bookingId || o.id.slice(-6).toUpperCase()}`,
    new Date(o.createdAt).toLocaleDateString(),
    o.chefName || 'Unassigned',
    o.userName || o.userEmail?.split('@')[0] || 'Customer',
    `INR ${o.totalAmount || 0}`,
    `INR ${o.commissionAdmin || Math.round((o.totalAmount || 0) * 0.3)}`,
    o.status,
    o.rating ? `${o.rating}★` : '-'
  ]);

  autoTable(doc, {
    startY: finalY + 10,
    head: [['Booking', 'Date', 'Chef', 'Customer', 'Bill', 'Admin Cut', 'Status', 'Rating']],
    body: recentOrders,
    theme: 'grid',
    headStyles: {
      fillColor: [55, 65, 81],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7.5
    }
  });

  doc.save(`Executive_HC_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}
