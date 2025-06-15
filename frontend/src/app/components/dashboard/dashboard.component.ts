import { Component, OnInit, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  lookerStudioUrl: string ="https://lookerstudio.google.com/embed/reporting/673ad8bb-dce6-4df4-a95a-5ff5a5940c64/page/F46NF";
  safeLookerStudioUrl: SafeResourceUrl;

  constructor (
    private sanitizer: DomSanitizer){
      this.safeLookerStudioUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.lookerStudioUrl);
    }
    ngOnInit(): void {
      
    }

}
