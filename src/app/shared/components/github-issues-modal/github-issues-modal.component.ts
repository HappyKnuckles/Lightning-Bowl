import { CommonModule } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonModal } from '@ionic/angular';
import {
  IonContent,
  IonItem,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonIcon,
  IonChip,
  IonAvatar,
  IonImg,
  IonButtons,
  IonToolbar,
  IonHeader,
  IonTitle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { documentOutline, openOutline, warningOutline } from 'ionicons/icons';
import { GitHubIssue } from 'src/app/core/models/github-issue.model';
import { GitHubService } from 'src/app/core/services/github/github.service';
import { RelativeTimePipe } from 'src/app/core/pipes/relative-time.pipe';
import { TextColorPipe } from 'src/app/core/pipes/text-color.pipe';

@Component({
  selector: 'app-github-issues-modal',
  templateUrl: './github-issues-modal.component.html',
  styleUrls: ['./github-issues-modal.component.scss'],
  standalone: true,
  imports: [
    IonTitle,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonImg,
    IonAvatar,
    IonChip,
    IonIcon,
    IonSpinner,
    IonCardContent,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonList,
    IonSelectOption,
    IonSelect,
    IonButton,
    IonItem,
    IonContent,
    CommonModule,
    FormsModule,
    RelativeTimePipe,
    TextColorPipe,
  ],
})
export class GithubIssuesModalComponent implements OnInit {
  modal = input.required<IonModal>();
  issues: GitHubIssue[] = [];
  loading = false;
  selectedLabels: string[] = ['']; // Empty array to show all issues by default
  error: string | null = null;

  constructor(private gitHubService: GitHubService) {
    addIcons({
      documentOutline,
      openOutline,
      warningOutline,
    });
  }

  ngOnInit(): void {
    this.loadIssues();
  }

  async loadIssues(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      this.issues = await this.gitHubService.getIssues(this.selectedLabels);
    } catch (error) {
      console.error('Failed to load issues:', error);
      this.issues = [];
      this.error =
        'Unable to load issues. This may be due to network restrictions or API limitations. Please visit the GitHub repository directly for the latest issues.';
    } finally {
      this.loading = false;
    }
  }

  onLabelFilterChange(): void {
    this.loadIssues();
  }

  getTruncatedBody(body: string): string {
    if (!body || body.length <= 200) {
      return body;
    }
    return body.substring(0, 200) + '...';
  }

  // No need for cancel method since modal is controlled by parent
}
