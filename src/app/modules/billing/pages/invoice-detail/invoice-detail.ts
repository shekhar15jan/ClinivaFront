import { Component } from '@angular/core';
import { NgClass, DecimalPipe, DatePipe } from '@angular/common';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

@Component({
  selector: 'app-invoice-detail',
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.scss',
  imports: [NgClass, DecimalPipe, DatePipe],
})
export class InvoiceDetail {
  invoiceNumber = 'INV-2023-001';
  date = new Date().toISOString();

  patient = {
    name: 'Rahul Sharma',
    uhid: '#P-00123',
    phone: '+91 9876543210',
  };

  status: 'Pending' | 'Paid' = 'Pending';
  taxRate = 0.05;

  lineItems: LineItem[] = [
    { id: '1', description: 'General Consultation - Dr. Smith', quantity: 1, rate: 500 },
    { id: '2', description: 'Complete Blood Count (CBC)', quantity: 1, rate: 350 },
  ];

  get subtotal(): number {
    return this.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  }

  get tax(): number {
    return this.subtotal * this.taxRate;
  }

  get total(): number {
    return this.subtotal + this.tax;
  }

  collectPayment(): void {
    if (this.status === 'Paid') return;

    // In real app, this opens a modal or redirects to gateway
    if (confirm(`Confirm collection of ₹${this.total.toFixed(2)}?`)) {
      this.status = 'Paid';
      alert('Payment collected successfully!');
    }
  }

  printInvoice(): void {
    window.print();
  }
}
