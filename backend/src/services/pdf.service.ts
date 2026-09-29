import PDFDocument from 'pdfkit';
import { prisma } from '../prisma/client.js';

export async function generatePayslipPdf(payslipId: number): Promise<Buffer> {
  const payslip = await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: {
      payroll: true,
      employee: {
        include: {
          department: true,
          salaryStructures: {
            orderBy: { effectiveFrom: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!payslip) {
    throw new Error('Payslip not found');
  }

  const settings = await prisma.companySettings.findFirst();
  const companyName = settings?.companyName || 'WorkForce360 Technologies India Pvt Ltd';
  const companyAddress = settings?.companyAddress || 'Bengaluru, Karnataka, India';

  const emp = payslip.employee;
  const payroll = payslip.payroll;
  const structure = emp.salaryStructures[0];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[payslip.month - 1] || `Month ${payslip.month}`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    // Header styling
    doc
      .fillColor('#1E3A8A') // Deep Blue
      .fontSize(20)
      .text(companyName, { align: 'center', bold: true } as any)
      .fontSize(10)
      .fillColor('#4B5563')
      .text(companyAddress, { align: 'center' })
      .moveDown(0.5);

    doc
      .strokeColor('#E5E7EB')
      .lineWidth(1)
      .moveTo(40, doc.y)
      .lineTo(555, doc.y)
      .stroke()
      .moveDown(0.5);

    // Title & Payslip Info
    doc
      .fillColor('#111827')
      .fontSize(14)
      .text(`PAYSLIP FOR ${monthName.toUpperCase()} ${payslip.year}`, { align: 'center', bold: true } as any)
      .fontSize(10)
      .fillColor('#6B7280')
      .text(`Payslip No: ${payslip.payslipNumber}`, { align: 'center' })
      .moveDown(1);

    // Employee & Job Details Box
    const startY = doc.y;
    doc
      .rect(40, startY, 515, 80)
      .fillAndStroke('#F9FAFB', '#D1D5DB');

    doc
      .fillColor('#111827')
      .fontSize(10)
      .text(`Employee Name: ${emp.fullName}`, 50, startY + 12)
      .text(`Employee ID: ${emp.employeeCode}`, 50, startY + 32)
      .text(`Department: ${emp.department?.name || 'N/A'}`, 50, startY + 52)
      .text(`Designation: ${emp.designation}`, 300, startY + 12)
      .text(`Employment Type: ${emp.employmentType}`, 300, startY + 32)
      .text(`Payment Status: ${payroll.status}`, 300, startY + 52);

    doc.y = startY + 95;

    // Table Header: Earnings vs Deductions
    const tableTop = doc.y;
    doc
      .rect(40, tableTop, 255, 24)
      .fillAndStroke('#1E3A8A', '#1E3A8A')
      .rect(300, tableTop, 255, 24)
      .fillAndStroke('#DC2626', '#DC2626');

    doc
      .fillColor('#FFFFFF')
      .fontSize(10)
      .text('EARNINGS', 50, tableTop + 6, { bold: true } as any)
      .text('AMOUNT (INR)', 220, tableTop + 6, { bold: true } as any)
      .text('DEDUCTIONS', 310, tableTop + 6, { bold: true } as any)
      .text('AMOUNT (INR)', 480, tableTop + 6, { bold: true } as any);

    let y = tableTop + 28;

    // Helper for rows
    const drawRow = (earnLabel: string, earnVal: string, dedLabel: string, dedVal: string) => {
      doc
        .fillColor('#374151')
        .fontSize(9)
        .text(earnLabel, 50, y)
        .text(earnVal, 220, y)
        .text(dedLabel, 310, y)
        .text(dedVal, 480, y);
      y += 20;
    };

    const formatInr = (val: any) => `Rs. ${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    drawRow('Basic Salary', formatInr(payroll.basicSalary), 'Unpaid Leave', formatInr(payroll.leaveDeduction));
    drawRow('HRA', formatInr(structure?.hra || 0), 'Late Penalty', formatInr(payroll.lateDeduction));
    drawRow('Travel Allowance', formatInr(structure?.travelAllowance || 0), 'Loan / Advance', formatInr(payroll.loanDeduction));
    drawRow('Medical Allowance', formatInr(structure?.medicalAllowance || 0), 'Other Deductions', formatInr(payroll.otherDeduction));
    drawRow('Other Allowance', formatInr(structure?.otherAllowance || 0), '', '');
    drawRow('Overtime Pay', formatInr(payroll.overtimePay), '', '');

    // Totals Box
    doc
      .strokeColor('#E5E7EB')
      .lineWidth(1)
      .moveTo(40, y)
      .lineTo(555, y)
      .stroke();

    y += 8;
    doc
      .fillColor('#111827')
      .fontSize(10)
      .text('Total Earnings (Gross):', 50, y, { bold: true } as any)
      .text(formatInr(payroll.grossSalary), 220, y, { bold: true } as any)
      .text('Total Deductions:', 310, y, { bold: true } as any)
      .text(formatInr(payroll.totalDeductions), 480, y, { bold: true } as any);

    y += 25;

    // Net Salary Banner
    doc
      .rect(40, y, 515, 36)
      .fillAndStroke('#ECFDF5', '#10B981');

    doc
      .fillColor('#065F46')
      .fontSize(12)
      .text('NET SALARY PAYABLE:', 60, y + 10, { bold: true } as any)
      .fontSize(14)
      .text(formatInr(payroll.netSalary), 400, y + 8, { bold: true } as any);

    // Footer
    doc
      .fontSize(8)
      .fillColor('#9CA3AF')
      .text(
        'This is a system-generated payslip generated by WorkForce360 and does not require a physical signature.',
        40,
        780,
        { align: 'center', width: 515 }
      );

    doc.end();
  });
}
