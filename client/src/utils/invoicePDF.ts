import jsPDF from 'jspdf';

interface InvoiceData {
  id: string;
  gigId: string | null;
  chefId: string;
  businessId: string;
  hoursWorked: number;
  ratePerHour: number;
  totalAmount: number;
  notes: string | null;
  status: string;
  submittedAt: Date;
  isManual?: boolean;
  serviceTitle?: string;
  serviceDescription?: string;
  paymentMethod?: string;
  paymentLink?: string;
  sortCode?: string;
  accountNumber?: string;
  gig?: {
    title: string;
    location: string;
    startDate: string;
    endDate: string;
  };
  chef: {
    fullName: string;
    stripeAccountId: string | null;
  };
}

interface BusinessProfile {
  businessName: string;
  location: string;
  description: string;
}

export const generateInvoicePDF = (
  invoice: InvoiceData, 
  businessProfile: BusinessProfile
): jsPDF => {
  const pdf = new jsPDF();
  
  // Set up colors and fonts
  const primaryColor: [number, number, number] = [66, 135, 245]; // Blue
  const secondaryColor: [number, number, number] = [107, 114, 128]; // Gray
  const darkColor: [number, number, number] = [17, 24, 39]; // Dark gray
  
  // Header
  pdf.setFontSize(24);
  pdf.setTextColor(...primaryColor);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', 20, 30);
  
  // Invoice number and date
  pdf.setFontSize(10);
  pdf.setTextColor(...secondaryColor);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Invoice #: ${invoice.id.slice(0, 8).toUpperCase()}`, 20, 45);
  pdf.text(`Date: ${new Date(invoice.submittedAt).toLocaleDateString('en-GB')}`, 20, 52);
  pdf.text(`Status: ${invoice.status.toUpperCase()}`, 20, 59);
  
  // Chef Pantry branding (top right)
  pdf.setFontSize(16);
  pdf.setTextColor(...primaryColor);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Chef Pantry', 140, 30);
  pdf.setFontSize(8);
  pdf.setTextColor(...secondaryColor);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Chef-first Freelance Platform', 140, 38);
  pdf.text('www.thechefpantry.co', 140, 45);
  
  // Bill To section
  pdf.setFontSize(12);
  pdf.setTextColor(...darkColor);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BILL TO:', 20, 80);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(businessProfile.businessName, 20, 92);
  pdf.text(businessProfile.location, 20, 99);
  
  // From section
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FROM:', 120, 80);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(invoice.chef.fullName, 120, 92);
  pdf.text('Professional Chef', 120, 99);
  
  // Service details
  let yPos = 120;
  
  // Table header
  pdf.setFillColor(...primaryColor);
  pdf.rect(20, yPos, 170, 10, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('DESCRIPTION', 25, yPos + 7);
  pdf.text('HOURS', 120, yPos + 7);
  pdf.text('RATE', 140, yPos + 7);
  pdf.text('AMOUNT', 165, yPos + 7);
  
  yPos += 15;
  
  // Service row
  pdf.setTextColor(...darkColor);
  pdf.setFont('helvetica', 'normal');
  
  const description = invoice.isManual 
    ? invoice.serviceTitle || 'Manual Service'
    : invoice.gig?.title || 'Culinary Service';
    
  const location = invoice.isManual 
    ? '' 
    : invoice.gig?.location || '';
    
  pdf.text(description, 25, yPos);
  if (location) {
    pdf.setFontSize(8);
    pdf.setTextColor(...secondaryColor);
    pdf.text(`Location: ${location}`, 25, yPos + 5);
  }
  
  pdf.setFontSize(9);
  pdf.setTextColor(...darkColor);
  pdf.text(invoice.hoursWorked.toString(), 125, yPos);
  pdf.text(`£${Number(invoice.ratePerHour).toFixed(2)}`, 145, yPos);
  pdf.text(`£${Number(invoice.totalAmount).toFixed(2)}`, 170, yPos);
  
  yPos += 20;
  
  // Additional service details
  if (invoice.gig?.startDate && invoice.gig?.endDate) {
    pdf.setFontSize(8);
    pdf.setTextColor(...secondaryColor);
    const startDate = new Date(invoice.gig.startDate).toLocaleDateString('en-GB');
    const endDate = new Date(invoice.gig.endDate).toLocaleDateString('en-GB');
    pdf.text(`Service Period: ${startDate} - ${endDate}`, 25, yPos);
    yPos += 10;
  }
  
  if (invoice.notes) {
    pdf.text(`Notes: ${invoice.notes}`, 25, yPos);
    yPos += 10;
  }
  
  // Total section
  yPos += 10;
  pdf.line(20, yPos, 190, yPos);
  yPos += 10;
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL: ', 140, yPos);
  pdf.text(`£${Number(invoice.totalAmount).toFixed(2)}`, 170, yPos);
  
  // Payment details
  yPos += 20;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PAYMENT DETAILS:', 20, yPos);
  
  yPos += 10;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  if (invoice.paymentMethod === 'stripe' && invoice.paymentLink) {
    pdf.text('Payment Method: Stripe Online Payment', 20, yPos);
    yPos += 7;
    pdf.setTextColor(...primaryColor);
    pdf.text('Pay online: Visit the payment link provided in your email', 20, yPos);
  } else {
    pdf.text('Payment Method: Bank Transfer', 20, yPos);
    yPos += 7;
    if (invoice.sortCode && invoice.accountNumber) {
      pdf.text(`Sort Code: ${invoice.sortCode}`, 20, yPos);
      yPos += 7;
      pdf.text(`Account Number: ${invoice.accountNumber}`, 20, yPos);
      yPos += 7;
      pdf.text(`Account Name: ${invoice.chef.fullName}`, 20, yPos);
    }
  }
  
  // Footer
  yPos = 260;
  pdf.setFontSize(8);
  pdf.setTextColor(...secondaryColor);
  pdf.text('Generated by Chef Pantry - Professional Chef Network', 20, yPos);
  pdf.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}`, 20, yPos + 7);
  
  return pdf;
};

export const downloadInvoicePDF = (
  invoice: InvoiceData, 
  businessProfile: BusinessProfile
) => {
  const pdf = generateInvoicePDF(invoice, businessProfile);
  const fileName = `invoice-${invoice.id.slice(0, 8)}-${invoice.chef.fullName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  pdf.save(fileName);
};

export const getInvoicePDFBlob = (
  invoice: InvoiceData, 
  businessProfile: BusinessProfile
): Blob => {
  const pdf = generateInvoicePDF(invoice, businessProfile);
  return pdf.output('blob');
};