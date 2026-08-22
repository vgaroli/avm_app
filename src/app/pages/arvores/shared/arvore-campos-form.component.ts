import { Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EstadoArvore } from '../../../core/models/arvore.model';

export type ArvoreCamposFormGroup = FormGroup<{
  especie: FormControl<string>;
  diametroCm: FormControl<number | null>;
  estado: FormControl<EstadoArvore>;
  observacoes: FormControl<string>;
}>;

@Component({
  selector: 'app-arvore-campos-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <ng-container [formGroup]="formGroup()">
      <mat-form-field appearance="outline">
        <mat-label>Espécie</mat-label>
        <input matInput formControlName="especie" placeholder="Ex: Ipê-amarelo (opcional)" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Diâmetro do tronco (cm)</mat-label>
        <input matInput type="number" formControlName="diametroCm" placeholder="Opcional" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Estado da árvore</mat-label>
        <mat-select formControlName="estado">
          <mat-option value="saudavel">Saudável</mat-option>
          <mat-option value="atencao">Atenção</mat-option>
          <mat-option value="risco">Risco</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Observações</mat-label>
        <textarea matInput formControlName="observacoes" rows="3" placeholder="Opcional"></textarea>
      </mat-form-field>
    </ng-container>
  `,
})
export class ArvoreCamposFormComponent {
  readonly formGroup = input.required<ArvoreCamposFormGroup>();
}
