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
  bankName?: string;
  accountName?: string;
  gig?: {
    title: string;
    location: string;
    startDate: string;
    endDate: string;
  };
  chef: {
    fullName: string;
  };
  business?: {
    name: string;
  };
}

interface BusinessProfile {
  businessName: string;
  location: string;
  description: string;
}

const validateInvoiceData = (invoice: InvoiceData): void => {
  if (!invoice) {
    throw new Error('Invoice data is required');
  }
  if (!invoice.id) {
    throw new Error('Invoice ID is missing');
  }
  if (!invoice.chef?.fullName) {
    throw new Error('Chef name is missing');
  }
  if (invoice.totalAmount === undefined || invoice.totalAmount === null) {
    throw new Error('Invoice amount is missing');
  }
  if (!invoice.submittedAt) {
    throw new Error('Invoice submission date is missing');
  }
};

const validateBusinessProfile = (businessProfile: BusinessProfile): void => {
  if (!businessProfile) {
    throw new Error('Business profile is required');
  }
  if (!businessProfile.businessName) {
    throw new Error('Business name is missing');
  }
};

const safeText = (text: string | null | undefined, fallback: string = ''): string => {
  return text || fallback;
};

const safeNumber = (num: number | null | undefined, fallback: number = 0): number => {
  const value = num ?? fallback;
  return Number(value) || fallback;
};

export const generateInvoicePDF = (
  invoice: InvoiceData, 
  businessProfile: BusinessProfile
): jsPDF => {
  try {
    // Validate inputs
    validateInvoiceData(invoice);
    validateBusinessProfile(businessProfile);

    console.log('Generating PDF for invoice:', invoice.id);
    
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
    
    try {
      const submittedDate = new Date(invoice.submittedAt).toLocaleDateString('en-GB');
      pdf.text(`Date: ${submittedDate}`, 20, 52);
    } catch (error) {
      console.error('Error formatting date:', error);
      pdf.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 20, 52);
    }
    
    pdf.text(`Status: ${safeText(invoice.status, 'PENDING').toUpperCase()}`, 20, 59);
    
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
    pdf.text(safeText(businessProfile.businessName, 'Business'), 20, 92);
    pdf.text(safeText(businessProfile.location, 'Location not specified'), 20, 99);
    
    // From section
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FROM:', 120, 80);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(safeText(invoice.chef.fullName, 'Chef'), 120, 92);
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
      ? safeText(invoice.serviceTitle, 'Manual Service')
      : safeText(invoice.gig?.title, 'Culinary Service');
      
    const location = invoice.isManual 
      ? '' 
      : safeText(invoice.gig?.location, '');
      
    pdf.text(description, 25, yPos);
    if (location) {
      pdf.setFontSize(8);
      pdf.setTextColor(...secondaryColor);
      pdf.text(`Location: ${location}`, 25, yPos + 5);
    }
    
    pdf.setFontSize(9);
    pdf.setTextColor(...darkColor);
    pdf.text(safeNumber(invoice.hoursWorked).toString(), 125, yPos);
    pdf.text(`£${safeNumber(invoice.ratePerHour).toFixed(2)}`, 145, yPos);
    pdf.text(`£${safeNumber(invoice.totalAmount).toFixed(2)}`, 170, yPos);
    
    yPos += 20;
    
    // Additional service details
    if (invoice.gig?.startDate && invoice.gig?.endDate) {
      try {
        pdf.setFontSize(8);
        pdf.setTextColor(...secondaryColor);
        const startDate = new Date(invoice.gig.startDate).toLocaleDateString('en-GB');
        const endDate = new Date(invoice.gig.endDate).toLocaleDateString('en-GB');
        pdf.text(`Service Period: ${startDate} - ${endDate}`, 25, yPos);
        yPos += 10;
      } catch (error) {
        console.error('Error formatting service dates:', error);
      }
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
    pdf.text(`£${safeNumber(invoice.totalAmount).toFixed(2)}`, 170, yPos);
    
    // Payment details
    yPos += 20;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PAYMENT DETAILS:', 20, yPos);
    
    yPos += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    // Bank transfer payment details (only payment method supported)
    pdf.text('Payment Method: Bank Transfer', 20, yPos);
    yPos += 7;
    
    if (invoice.bankName) {
      pdf.text(`Bank Name: ${invoice.bankName}`, 20, yPos);
      yPos += 7;
    }
    
    if (invoice.sortCode) {
      pdf.text(`Sort Code: ${invoice.sortCode}`, 20, yPos);
      yPos += 7;
    }
    
    if (invoice.accountNumber) {
      pdf.text(`Account Number: ${invoice.accountNumber}`, 20, yPos);
      yPos += 7;
    }
    
    if (invoice.accountName || invoice.chef.fullName) {
      pdf.text(`Account Name: ${safeText(invoice.accountName, invoice.chef.fullName)}`, 20, yPos);
    }
    
    // Footer
    yPos = 260;
    pdf.setFontSize(8);
    pdf.setTextColor(...secondaryColor);
    pdf.text('Generated by Chef Pantry - Professional Chef Network', 20, yPos);
    pdf.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}`, 20, yPos + 7);
    
    console.log('PDF generated successfully for invoice:', invoice.id);
    return pdf;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const downloadInvoicePDF = (
  invoice: InvoiceData, 
  businessProfile: BusinessProfile
): void => {
  try {
    console.log('Starting PDF download for invoice:', invoice.id);
    const pdf = generateInvoicePDF(invoice, businessProfile);
    
    const chefName = safeText(invoice.chef?.fullName, 'chef');
    const sanitizedName = chefName.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const fileName = `invoice-${invoice.id.slice(0, 8)}-${sanitizedName}.pdf`;
    
    console.log('Downloading PDF with filename:', fileName);
    pdf.save(fileName);
    console.log('PDF download initiated successfully');
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw new Error(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getInvoicePDFBlob = (
  invoice: InvoiceData, 
  businessProfile: BusinessProfile
): Blob => {
  try {
    console.log('Generating PDF blob for invoice:', invoice.id);
    const pdf = generateInvoicePDF(invoice, businessProfile);
    const blob = pdf.output('blob');
    console.log('PDF blob generated successfully');
    return blob;
  } catch (error) {
    console.error('Error generating PDF blob:', error);
    throw new Error(`Failed to generate PDF blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
