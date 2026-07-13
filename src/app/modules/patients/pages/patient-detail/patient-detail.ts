import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PatientService } from '../../../../core/services/patient.service';
import { Patient, VisitItem } from '../../../../core/models/patient.model';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-patient-detail',
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.scss',
  imports: [RouterLink, NgClass],
})
export class PatientDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private patientService = inject(PatientService);

  patientId = '';
  patient: Patient | null = null;
  visits: VisitItem[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.patientId = params['id'];
      this.loadPatientDetails(this.patientId);
    });
  }

  loadPatientDetails(id: string) {
    this.isLoading = true;
    this.patientService.getPatients().subscribe((res) => {
      if (res.success) {
        const p = res.data.content.find((p: Patient) => p.id === id);
        if (p) {
          this.patient = p;
        }
      }
      this.isLoading = false;
    });
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
