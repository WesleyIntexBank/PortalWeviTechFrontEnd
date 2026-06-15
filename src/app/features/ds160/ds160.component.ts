import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { DS160Service, DS160Response } from '../../core/services/ds160.service';

@Component({
  selector: 'app-ds160',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatStepperModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatSlideToggleModule,
    MatProgressSpinnerModule, MatDividerModule, MatChipsModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <mat-icon>flight_takeoff</mat-icon>
        <h1>DS-160 — Formulário de Visto Americano</h1>
      </div>

      <mat-stepper [linear]="false" #stepper class="stepper">

        <!-- ── 1. DADOS PESSOAIS ──────────────────────────────── -->
        <mat-step label="Dados Pessoais" [stepControl]="personalForm">
          <form [formGroup]="personalForm" class="step-form">
            <h3 class="section-title">Identificação</h3>
            <div class="form-row">
              <mat-form-field appearance="outline" class="field-grow">
                <mat-label>Sobrenome</mat-label>
                <input matInput formControlName="surname" placeholder="SILVA">
              </mat-form-field>
              <mat-form-field appearance="outline" class="field-grow">
                <mat-label>Nome</mat-label>
                <input matInput formControlName="givenName" placeholder="JOAO">
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Nome completo no alfabeto nativo</mat-label>
              <input matInput formControlName="fullNameNativeAlphabet">
            </mat-form-field>
            <div class="toggle-row">
              <mat-slide-toggle formControlName="hasOtherNames" color="primary">Possui outros nomes?</mat-slide-toggle>
            </div>
            @if (personalForm.value.hasOtherNames) {
              <div class="form-row">
                <mat-form-field appearance="outline" class="field-grow">
                  <mat-label>Outro sobrenome</mat-label>
                  <input matInput formControlName="otherSurname">
                </mat-form-field>
                <mat-form-field appearance="outline" class="field-grow">
                  <mat-label>Outro nome</mat-label>
                  <input matInput formControlName="otherGivenName">
                </mat-form-field>
              </div>
            }
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Sexo</mat-label>
                <mat-select formControlName="sex">
                  <mat-option value="M">Masculino</mat-option>
                  <mat-option value="F">Feminino</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Estado Civil</mat-label>
                <mat-select formControlName="maritalStatus">
                  <mat-option value="S">Solteiro(a)</mat-option>
                  <mat-option value="M">Casado(a)</mat-option>
                  <mat-option value="W">Viúvo(a)</mat-option>
                  <mat-option value="D">Divorciado(a)</mat-option>
                  <mat-option value="P">Separado(a)</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Data de Nascimento</mat-label>
                <input matInput formControlName="dateOfBirth" type="date">
              </mat-form-field>
            </div>

            <h3 class="section-title">Local de Nascimento</h3>
            <div class="form-row">
              <mat-form-field appearance="outline" class="field-grow">
                <mat-label>Cidade</mat-label>
                <input matInput formControlName="cityOfBirth">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Estado (opcional)</mat-label>
                <input matInput formControlName="stateOfBirth">
              </mat-form-field>
              <mat-form-field appearance="outline" class="field-grow">
                <mat-label>País</mat-label>
                <input matInput formControlName="countryOfBirth">
              </mat-form-field>
            </div>

            <h3 class="section-title">Nacionalidade</h3>
            <div class="form-row">
              <mat-form-field appearance="outline" class="field-grow">
                <mat-label>Nacionalidade</mat-label>
                <input matInput formControlName="nationality">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Nº Documento Nacional</mat-label>
                <input matInput formControlName="nationalIdNumber">
              </mat-form-field>
            </div>
            <div class="toggle-row">
              <mat-slide-toggle formControlName="hasOtherNationality" color="primary">Outra nacionalidade?</mat-slide-toggle>
            </div>
            @if (personalForm.value.hasOtherNationality) {
              <mat-form-field appearance="outline">
                <mat-label>Outra nacionalidade</mat-label>
                <input matInput formControlName="otherNationality">
              </mat-form-field>
            }
            <div class="toggle-row">
              <mat-slide-toggle formControlName="isPermanentResidentOtherCountry" color="primary">
                Residente permanente em outro país?
              </mat-slide-toggle>
            </div>
            @if (personalForm.value.isPermanentResidentOtherCountry) {
              <mat-form-field appearance="outline">
                <mat-label>País de residência permanente</mat-label>
                <input matInput formControlName="permanentResidentCountry">
              </mat-form-field>
            }

            <h3 class="section-title">Identificação nos EUA (opcional)</h3>
            <div class="toggle-row">
              <mat-slide-toggle formControlName="hasUsSocialSecurity" color="primary">Possui Social Security Number?</mat-slide-toggle>
            </div>
            @if (personalForm.value.hasUsSocialSecurity) {
              <mat-form-field appearance="outline">
                <mat-label>Social Security Number</mat-label>
                <input matInput formControlName="usSocialSecurityNumber">
              </mat-form-field>
            }
            <div class="toggle-row">
              <mat-slide-toggle formControlName="hasUsTaxId" color="primary">Possui US Tax ID?</mat-slide-toggle>
            </div>
            @if (personalForm.value.hasUsTaxId) {
              <mat-form-field appearance="outline">
                <mat-label>US Tax ID</mat-label>
                <input matInput formControlName="usTaxId">
              </mat-form-field>
            }
            <div class="step-actions">
              <button mat-flat-button color="primary" matStepperNext>Próximo <mat-icon>chevron_right</mat-icon></button>
            </div>
          </form>
        </mat-step>

        <!-- ── 2. ENDEREÇO E CONTATO ──────────────────────────── -->
        <mat-step label="Endereço e Contato" [stepControl]="addressForm">
          <form [formGroup]="addressForm" class="step-form">
            <h3 class="section-title">Endereço Residencial</h3>
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Endereço (linha 1)</mat-label>
              <input matInput formControlName="homeAddressLine1">
            </mat-form-field>
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Endereço (linha 2, opcional)</mat-label>
              <input matInput formControlName="homeAddressLine2">
            </mat-form-field>
            <div class="form-row">
              <mat-form-field appearance="outline" class="field-grow">
                <mat-label>Cidade</mat-label>
                <input matInput formControlName="homeAddressCity">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Estado</mat-label>
                <input matInput formControlName="homeAddressState">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>CEP</mat-label>
                <input matInput formControlName="homeAddressPostalCode">
              </mat-form-field>
              <mat-form-field appearance="outline" class="field-grow">
                <mat-label>País</mat-label>
                <input matInput formControlName="homeAddressCountry">
              </mat-form-field>
            </div>

            <h3 class="section-title">Telefone e E-mail</h3>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Tel. Residencial</mat-label>
                <input matInput formControlName="homePhone">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Celular</mat-label>
                <input matInput formControlName="mobilePhone">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Tel. Comercial</mat-label>
                <input matInput formControlName="workPhone">
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>E-mail</mat-label>
              <input matInput formControlName="email" type="email">
            </mat-form-field>
            <div class="step-actions">
              <button mat-button matStepperPrevious><mat-icon>chevron_left</mat-icon> Anterior</button>
              <button mat-flat-button color="primary" matStepperNext>Próximo <mat-icon>chevron_right</mat-icon></button>
            </div>
          </form>
        </mat-step>

        <!-- ── 3. PASSAPORTE ──────────────────────────────────── -->
        <mat-step label="Passaporte" [stepControl]="passportForm">
          <form [formGroup]="passportForm" class="step-form">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Tipo de Passaporte</mat-label>
                <mat-select formControlName="passportType">
                  <mat-option value="B">Regular (B)</mat-option>
                  <mat-option value="D">Diplomático (D)</mat-option>
                  <mat-option value="O">Oficial (O)</mat-option>
                  <mat-option value="L">Laissez-passer (L)</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="field-grow">
                <mat-label>Número do Passaporte</mat-label>
                <input matInput formControlName="passportNumber">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Número do Livro</mat-label>
                <input matInput formControlName="passportBookNumber">
              </mat-form-field>
            </div>
            <div class="form-row">
              <mat-form-field appearance="outline" class="field-grow">
                <mat-label>País de Emissão</mat-label>
                <input matInput formControlName="passportCountry">
              </mat-form-field>
              <mat-form-field appearance="outline" class="field-grow">
                <mat-label>Cidade de Emissão</mat-label>
                <input matInput formControlName="passportIssuanceCity">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>País de Emissão (autoridade)</mat-label>
                <input matInput formControlName="passportIssuanceCountry">
              </mat-form-field>
            </div>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Data de Emissão</mat-label>
                <input matInput formControlName="passportIssuanceDate" type="date">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Data de Validade</mat-label>
                <input matInput formControlName="passportExpirationDate" type="date">
              </mat-form-field>
            </div>
            <div class="toggle-row">
              <mat-slide-toggle formControlName="hasLostOrStolenPassport" color="warn">
                Passaporte perdido ou roubado?
              </mat-slide-toggle>
            </div>
            @if (passportForm.value.hasLostOrStolenPassport) {
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Nº do passaporte perdido</mat-label>
                  <input matInput formControlName="lostPassportNumber">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>País</mat-label>
                  <input matInput formControlName="lostPassportCountry">
                </mat-form-field>
              </div>
              <mat-form-field appearance="outline" class="field-full">
                <mat-label>Explicação</mat-label>
                <textarea matInput formControlName="lostPassportExplanation" rows="3"></textarea>
              </mat-form-field>
            }
            <div class="step-actions">
              <button mat-button matStepperPrevious><mat-icon>chevron_left</mat-icon> Anterior</button>
              <button mat-flat-button color="primary" matStepperNext>Próximo <mat-icon>chevron_right</mat-icon></button>
            </div>
          </form>
        </mat-step>

        <!-- ── 4. INFORMAÇÕES DE VIAGEM ───────────────────────── -->
        <mat-step label="Viagem" [stepControl]="travelForm">
          <form [formGroup]="travelForm" class="step-form">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Propósito da Viagem</mat-label>
                <mat-select formControlName="travelPurpose">
                  <mat-option value="B">Negócios (B1)</mat-option>
                  <mat-option value="T">Turismo (B2)</mat-option>
                  <mat-option value="S">Estudo (F)</mat-option>
                  <mat-option value="E">Intercâmbio (J)</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="field-grow">
                <mat-label>Propósito específico</mat-label>
                <input matInput formControlName="specificTravelPurpose">
              </mat-form-field>
            </div>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Data prevista de chegada</mat-label>
                <input matInput formControlName="intendedArrivalDate" type="date">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Tempo de permanência</mat-label>
                <input matInput formControlName="intendedLengthOfStay" placeholder="30 DAYS">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Fonte de recursos</mat-label>
                <mat-select formControlName="travelFundingSource">
                  <mat-option value="SELF">Próprios</mat-option>
                  <mat-option value="COMPANY">Empresa</mat-option>
                  <mat-option value="OTHER">Outro</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Detalhes do financiamento (opcional)</mat-label>
              <input matInput formControlName="travelFundingDetails">
            </mat-form-field>

            <h3 class="section-title">Endereço nos EUA</h3>
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Endereço (linha 1)</mat-label>
              <input matInput formControlName="usAddressLine1">
            </mat-form-field>
            <div class="form-row">
              <mat-form-field appearance="outline" class="field-grow">
                <mat-label>Cidade</mat-label>
                <input matInput formControlName="usAddressCity">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Estado</mat-label>
                <input matInput formControlName="usAddressState">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>ZIP</mat-label>
                <input matInput formControlName="usAddressZip">
              </mat-form-field>
            </div>

            <h3 class="section-title">Acompanhantes</h3>
            <div class="toggle-row">
              <mat-slide-toggle formControlName="hasTravelCompanions" color="primary">Viaja acompanhado?</mat-slide-toggle>
            </div>
            @if (travelForm.value.hasTravelCompanions) {
              @for (c of companions.controls; track $index) {
                <div [formGroup]="$any(c)" class="form-row list-item">
                  <mat-form-field appearance="outline">
                    <mat-label>Sobrenome</mat-label>
                    <input matInput formControlName="surname">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Nome</mat-label>
                    <input matInput formControlName="givenName">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Relação</mat-label>
                    <input matInput formControlName="relationship">
                  </mat-form-field>
                  <button mat-icon-button color="warn" (click)="companions.removeAt($index)">
                    <mat-icon>remove_circle</mat-icon>
                  </button>
                </div>
              }
              <button mat-stroked-button color="primary" (click)="addCompanion()" class="add-btn">
                <mat-icon>add</mat-icon> Adicionar acompanhante
              </button>
            }
            <div class="step-actions">
              <button mat-button matStepperPrevious><mat-icon>chevron_left</mat-icon> Anterior</button>
              <button mat-flat-button color="primary" matStepperNext>Próximo <mat-icon>chevron_right</mat-icon></button>
            </div>
          </form>
        </mat-step>

        <!-- ── 5. HISTÓRICO NOS EUA ───────────────────────────── -->
        <mat-step label="Histórico EUA" [stepControl]="usHistoryForm">
          <form [formGroup]="usHistoryForm" class="step-form">
            <div class="toggle-row">
              <mat-slide-toggle formControlName="hasBeenInUsBefore" color="primary">
                Já esteve nos EUA anteriormente?
              </mat-slide-toggle>
            </div>
            @if (usHistoryForm.value.hasBeenInUsBefore) {
              @for (t of usTravels.controls; track $index) {
                <div [formGroup]="$any(t)" class="form-row list-item">
                  <mat-form-field appearance="outline">
                    <mat-label>Data de chegada</mat-label>
                    <input matInput formControlName="arrivalDate" type="date">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Tempo de permanência</mat-label>
                    <input matInput formControlName="lengthOfStay">
                  </mat-form-field>
                  <button mat-icon-button color="warn" (click)="usTravels.removeAt($index)">
                    <mat-icon>remove_circle</mat-icon>
                  </button>
                </div>
              }
              <button mat-stroked-button color="primary" (click)="addUsTravel()" class="add-btn">
                <mat-icon>add</mat-icon> Adicionar visita
              </button>
            }

            <mat-divider class="divider"></mat-divider>

            <div class="toggle-row">
              <mat-slide-toggle formControlName="hasBeenIssuedUsVisa" color="primary">
                Já teve visto americano?
              </mat-slide-toggle>
            </div>
            @if (usHistoryForm.value.hasBeenIssuedUsVisa) {
              @for (v of previousVisas.controls; track $index) {
                <div [formGroup]="$any(v)" class="form-row list-item">
                  <mat-form-field appearance="outline">
                    <mat-label>Nº do visto</mat-label>
                    <input matInput formControlName="visaNumber">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Data de emissão</mat-label>
                    <input matInput formControlName="issuanceDate" type="date">
                  </mat-form-field>
                  <div class="toggle-col">
                    <mat-slide-toggle formControlName="isVisaInPassport" color="primary">No passaporte atual?</mat-slide-toggle>
                    <mat-slide-toggle formControlName="isVisaSameType" color="primary">Mesmo tipo?</mat-slide-toggle>
                    <mat-slide-toggle formControlName="hasBeenTenPrinted" color="primary">Ten-printed?</mat-slide-toggle>
                  </div>
                  <button mat-icon-button color="warn" (click)="previousVisas.removeAt($index)">
                    <mat-icon>remove_circle</mat-icon>
                  </button>
                </div>
              }
              <button mat-stroked-button color="primary" (click)="addPreviousVisa()" class="add-btn">
                <mat-icon>add</mat-icon> Adicionar visto anterior
              </button>
            }

            <mat-divider class="divider"></mat-divider>

            <div class="toggle-row">
              <mat-slide-toggle formControlName="hasUsVisaRefused" color="warn">Visto negado anteriormente?</mat-slide-toggle>
            </div>
            @if (usHistoryForm.value.hasUsVisaRefused) {
              <mat-form-field appearance="outline" class="field-full">
                <mat-label>Explicação</mat-label>
                <textarea matInput formControlName="visaRefusedExplanation" rows="3"></textarea>
              </mat-form-field>
            }

            <div class="toggle-row">
              <mat-slide-toggle formControlName="hasImmigrantPetition" color="warn">
                Petição de imigração em andamento?
              </mat-slide-toggle>
            </div>

            <div class="step-actions">
              <button mat-button matStepperPrevious><mat-icon>chevron_left</mat-icon> Anterior</button>
              <button mat-flat-button color="primary" matStepperNext>Próximo <mat-icon>chevron_right</mat-icon></button>
            </div>
          </form>
        </mat-step>

        <!-- ── 6. CONTATO NOS EUA ─────────────────────────────── -->
        <mat-step label="Contato EUA" [stepControl]="usContactForm">
          <form [formGroup]="usContactForm" class="step-form">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Sobrenome</mat-label>
                <input matInput formControlName="usContactSurname">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Nome</mat-label>
                <input matInput formControlName="usContactGivenName">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Relação</mat-label>
                <mat-select formControlName="usContactRelationship">
                  <mat-option value="FRIEND">Amigo(a)</mat-option>
                  <mat-option value="RELATIVE">Parente</mat-option>
                  <mat-option value="BUSINESS">Negócios</mat-option>
                  <mat-option value="OTHER">Outro</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Organização (opcional)</mat-label>
              <input matInput formControlName="usContactOrganization">
            </mat-form-field>
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Endereço</mat-label>
              <input matInput formControlName="usContactAddressLine1">
            </mat-form-field>
            <div class="form-row">
              <mat-form-field appearance="outline" class="field-grow">
                <mat-label>Cidade</mat-label>
                <input matInput formControlName="usContactCity">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Estado</mat-label>
                <input matInput formControlName="usContactState">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>ZIP</mat-label>
                <input matInput formControlName="usContactZip">
              </mat-form-field>
            </div>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Telefone</mat-label>
                <input matInput formControlName="usContactPhone">
              </mat-form-field>
              <mat-form-field appearance="outline" class="field-grow">
                <mat-label>E-mail (opcional)</mat-label>
                <input matInput formControlName="usContactEmail" type="email">
              </mat-form-field>
            </div>
            <div class="step-actions">
              <button mat-button matStepperPrevious><mat-icon>chevron_left</mat-icon> Anterior</button>
              <button mat-flat-button color="primary" matStepperNext>Próximo <mat-icon>chevron_right</mat-icon></button>
            </div>
          </form>
        </mat-step>

        <!-- ── 7. FAMÍLIA ─────────────────────────────────────── -->
        <mat-step label="Família" [stepControl]="familyForm">
          <form [formGroup]="familyForm" class="step-form">
            <h3 class="section-title">Pai</h3>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Sobrenome do pai</mat-label>
                <input matInput formControlName="fatherSurname">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Nome do pai</mat-label>
                <input matInput formControlName="fatherGivenName">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Data de nascimento</mat-label>
                <input matInput formControlName="fatherDateOfBirth" type="date">
              </mat-form-field>
              <div class="toggle-col">
                <mat-slide-toggle formControlName="fatherIsUsNational" color="primary">Cidadão americano?</mat-slide-toggle>
              </div>
            </div>

            <h3 class="section-title">Mãe</h3>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Sobrenome da mãe</mat-label>
                <input matInput formControlName="motherSurname">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Nome da mãe</mat-label>
                <input matInput formControlName="motherGivenName">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Data de nascimento</mat-label>
                <input matInput formControlName="motherDateOfBirth" type="date">
              </mat-form-field>
              <div class="toggle-col">
                <mat-slide-toggle formControlName="motherIsUsNational" color="primary">Cidadã americana?</mat-slide-toggle>
              </div>
            </div>

            <h3 class="section-title">Cônjuge</h3>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Sobrenome</mat-label>
                <input matInput formControlName="spouseSurname">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Nome</mat-label>
                <input matInput formControlName="spouseGivenName">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Data de nascimento</mat-label>
                <input matInput formControlName="spouseDateOfBirth" type="date">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Nacionalidade</mat-label>
                <input matInput formControlName="spouseNationality">
              </mat-form-field>
            </div>

            <h3 class="section-title">Parentes nos EUA</h3>
            <div class="toggle-row">
              <mat-slide-toggle formControlName="hasRelativeInUs" color="primary">Possui parentes nos EUA?</mat-slide-toggle>
            </div>
            @if (familyForm.value.hasRelativeInUs) {
              @for (r of usRelatives.controls; track $index) {
                <div [formGroup]="$any(r)" class="form-row list-item">
                  <mat-form-field appearance="outline">
                    <mat-label>Sobrenome</mat-label>
                    <input matInput formControlName="surname">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Nome</mat-label>
                    <input matInput formControlName="givenName">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Status</mat-label>
                    <input matInput formControlName="status">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Relação</mat-label>
                    <input matInput formControlName="relationship">
                  </mat-form-field>
                  <button mat-icon-button color="warn" (click)="usRelatives.removeAt($index)">
                    <mat-icon>remove_circle</mat-icon>
                  </button>
                </div>
              }
              <button mat-stroked-button color="primary" (click)="addUsRelative()" class="add-btn">
                <mat-icon>add</mat-icon> Adicionar parente
              </button>
            }
            <div class="step-actions">
              <button mat-button matStepperPrevious><mat-icon>chevron_left</mat-icon> Anterior</button>
              <button mat-flat-button color="primary" matStepperNext>Próximo <mat-icon>chevron_right</mat-icon></button>
            </div>
          </form>
        </mat-step>

        <!-- ── 8. TRABALHO / EDUCAÇÃO ─────────────────────────── -->
        <mat-step label="Trabalho/Educação" [stepControl]="workForm">
          <form [formGroup]="workForm" class="step-form">
            <h3 class="section-title">Ocupação</h3>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Ocupação principal</mat-label>
                <mat-select formControlName="primaryOccupation">
                  <mat-option value="STUDENT">Estudante</mat-option>
                  <mat-option value="EMPLOYED">Empregado(a)</mat-option>
                  <mat-option value="SELF">Autônomo(a)</mat-option>
                  <mat-option value="RETIRED">Aposentado(a)</mat-option>
                  <mat-option value="UNEMPLOYED">Desempregado(a)</mat-option>
                  <mat-option value="HOMEMAKER">Dona(o) de casa</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="field-grow">
                <mat-label>Empresa / Escola</mat-label>
                <input matInput formControlName="employerSchoolName">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Renda mensal (USD)</mat-label>
                <input matInput formControlName="monthlyIncome">
              </mat-form-field>
            </div>
            <div class="form-row">
              <mat-form-field appearance="outline" class="field-grow">
                <mat-label>Endereço da empresa/escola</mat-label>
                <input matInput formControlName="employerSchoolAddressLine1">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Cidade</mat-label>
                <input matInput formControlName="employerSchoolCity">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>País</mat-label>
                <input matInput formControlName="employerSchoolCountry">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Telefone</mat-label>
                <input matInput formControlName="employerSchoolPhone">
              </mat-form-field>
            </div>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Início do emprego</mat-label>
                <input matInput formControlName="employmentStartDate" type="date">
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>Descrição das funções</mat-label>
              <textarea matInput formControlName="jobDescription" rows="3"></textarea>
            </mat-form-field>

            <h3 class="section-title">Educação</h3>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Nível de educação</mat-label>
                <mat-select formControlName="highestLevelOfEducation">
                  <mat-option value="N">Nenhum</mat-option>
                  <mat-option value="E">Fundamental</mat-option>
                  <mat-option value="H">Ensino Médio</mat-option>
                  <mat-option value="V">Técnico</mat-option>
                  <mat-option value="U">Superior</mat-option>
                  <mat-option value="M">Pós-graduação</mat-option>
                  <mat-option value="D">Doutorado</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="field-grow">
                <mat-label>Instituição</mat-label>
                <input matInput formControlName="institutionName">
              </mat-form-field>
            </div>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Cidade</mat-label>
                <input matInput formControlName="institutionCity">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>País</mat-label>
                <input matInput formControlName="institutionCountry">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Curso</mat-label>
                <input matInput formControlName="courseOfStudy">
              </mat-form-field>
            </div>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Início dos estudos</mat-label>
                <input matInput formControlName="studyStartDate" type="date">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Fim dos estudos</mat-label>
                <input matInput formControlName="studyEndDate" type="date">
              </mat-form-field>
            </div>
            <div class="step-actions">
              <button mat-button matStepperPrevious><mat-icon>chevron_left</mat-icon> Anterior</button>
              <button mat-flat-button color="primary" matStepperNext>Próximo <mat-icon>chevron_right</mat-icon></button>
            </div>
          </form>
        </mat-step>

        <!-- ── 9. ANTECEDENTES ────────────────────────────────── -->
        <mat-step label="Antecedentes" [stepControl]="securityForm">
          <form [formGroup]="securityForm" class="step-form">
            <div class="security-info">
              <mat-icon>info_outline</mat-icon>
              <span>Responda "Sim" apenas se aplicável. A maioria das pessoas responde "Não" para todas.</span>
            </div>

            <h3 class="section-title">Saúde</h3>
            <div class="security-grid">
              <div class="security-item">
                <mat-slide-toggle formControlName="hasCommunicableDisease" color="warn">Doença comunicável?</mat-slide-toggle>
              </div>
              <div class="security-item">
                <mat-slide-toggle formControlName="hasMentalDisorder" color="warn">Distúrbio mental?</mat-slide-toggle>
              </div>
              <div class="security-item">
                <mat-slide-toggle formControlName="hasDrugAbuser" color="warn">Abuso de drogas?</mat-slide-toggle>
              </div>
            </div>

            <h3 class="section-title">Antecedentes Criminais</h3>
            <div class="security-grid">
              <div class="security-item">
                <mat-slide-toggle formControlName="hasArrestedOrConvicted" color="warn">Preso ou condenado?</mat-slide-toggle>
              </div>
              <div class="security-item">
                <mat-slide-toggle formControlName="hasControlledSubstanceViolation" color="warn">Infração de entorpecentes?</mat-slide-toggle>
              </div>
              <div class="security-item">
                <mat-slide-toggle formControlName="hasProstitution" color="warn">Prostituição?</mat-slide-toggle>
              </div>
              <div class="security-item">
                <mat-slide-toggle formControlName="hasMoneyLaundering" color="warn">Lavagem de dinheiro?</mat-slide-toggle>
              </div>
              <div class="security-item">
                <mat-slide-toggle formControlName="hasHumanTrafficking" color="warn">Tráfico humano?</mat-slide-toggle>
              </div>
            </div>

            <h3 class="section-title">Segurança</h3>
            <div class="security-grid">
              <div class="security-item">
                <mat-slide-toggle formControlName="hasTerroristActivities" color="warn">Atividades terroristas?</mat-slide-toggle>
              </div>
              <div class="security-item">
                <mat-slide-toggle formControlName="hasGenocide" color="warn">Genocídio?</mat-slide-toggle>
              </div>
              <div class="security-item">
                <mat-slide-toggle formControlName="hasTortureOrViolence" color="warn">Tortura ou violência?</mat-slide-toggle>
              </div>
              <div class="security-item">
                <mat-slide-toggle formControlName="hasChildSoldier" color="warn">Criança-soldado?</mat-slide-toggle>
              </div>
              <div class="security-item">
                <mat-slide-toggle formControlName="hasReligiousFreedomViolation" color="warn">Violação religiosa?</mat-slide-toggle>
              </div>
              <div class="security-item">
                <mat-slide-toggle formControlName="hasSignificantTraffickerInPersons" color="warn">Traficante?</mat-slide-toggle>
              </div>
            </div>

            <h3 class="section-title">Imigração</h3>
            <div class="security-grid">
              <div class="security-item">
                <mat-slide-toggle formControlName="hasIllegallyInUs" color="warn">Permaneceu ilegalmente nos EUA?</mat-slide-toggle>
              </div>
              <div class="security-item">
                <mat-slide-toggle formControlName="hasViolatedVisaTerms" color="warn">Violou termos do visto?</mat-slide-toggle>
              </div>
              <div class="security-item">
                <mat-slide-toggle formControlName="hasDeported" color="warn">Foi deportado?</mat-slide-toggle>
              </div>
              <div class="security-item">
                <mat-slide-toggle formControlName="hasAttendedChildCustody" color="warn">Guarda de criança?</mat-slide-toggle>
              </div>
              <div class="security-item">
                <mat-slide-toggle formControlName="hasVotedInUs" color="warn">Votou nos EUA?</mat-slide-toggle>
              </div>
              <div class="security-item">
                <mat-slide-toggle formControlName="hasRenounceUsNationality" color="warn">Renunciou cidadania americana?</mat-slide-toggle>
              </div>
              <div class="security-item">
                <mat-slide-toggle formControlName="hasTaxEvasion" color="warn">Evasão fiscal?</mat-slide-toggle>
              </div>
            </div>

            <mat-form-field appearance="outline" class="field-full" style="margin-top:16px">
              <mat-label>Explicações (se respondeu Sim em alguma questão)</mat-label>
              <textarea matInput formControlName="securityExplanation" rows="4"></textarea>
            </mat-form-field>

            <div class="step-actions">
              <button mat-button matStepperPrevious><mat-icon>chevron_left</mat-icon> Anterior</button>
              <button mat-flat-button color="accent" (click)="submit()" [disabled]="loading()" class="btn-submit">
                @if (loading()) { <mat-spinner diameter="20"></mat-spinner> }
                @else { <mat-icon>send</mat-icon> }
                {{ loading() ? 'Enviando...' : 'Enviar DS-160' }}
              </button>
            </div>
          </form>
        </mat-step>

      </mat-stepper>

      <!-- ── RESULTADO ──────────────────────────────────────────── -->
      @if (result()) {
        <div class="result-card" [class.success]="result()!.success" [class.failed]="!result()!.success">
          <div class="result-header">
            <mat-icon>{{ result()!.success ? 'check_circle' : 'error' }}</mat-icon>
            <span>{{ result()!.success ? 'DS-160 Enviado com Sucesso' : 'Falha no Envio' }}</span>
            @if (result()!.applicationId) {
              <span class="app-id">ID: {{ result()!.applicationId }}</span>
            }
          </div>
          @if (result()!.statusMessage) {
            <p class="result-msg">{{ result()!.statusMessage }}</p>
          }
          @if (result()!.errors.length) {
            <ul class="error-list">
              @for (e of result()!.errors; track e) { <li>{{ e }}</li> }
            </ul>
          }
          @if (result()!.screenshotBase64) {
            <img [src]="'data:image/png;base64,' + result()!.screenshotBase64"
                 alt="Screenshot" class="screenshot">
          }
        </div>
      }

      @if (error()) {
        <div class="feedback-banner error">
          <mat-icon>error_outline</mat-icon>
          <span>{{ error() }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 20px; }

    .page-header {
      display: flex; align-items: center; gap: 12px;
      mat-icon { font-size: 28px; width: 28px; height: 28px; color: var(--primary, #3d5afe); }
      h1 { margin: 0; font-size: 22px; font-weight: 700; color: var(--text); }
    }

    .stepper {
      background: transparent;

      /* ── Stepper header ── */
      ::ng-deep .mat-step-header {
        background: transparent !important;
        .mat-step-label { color: var(--text-sec) !important; }
        .mat-step-label.mat-step-label-active { color: var(--text) !important; }
        .mat-step-label.mat-step-label-selected { color: var(--accent) !important; }
        .mat-step-icon { background: var(--surface) !important; color: var(--text-sec) !important; }
        .mat-step-icon-selected { background: var(--primary) !important; color: #fff !important; }
        &:hover { background: var(--row-hover) !important; }
      }

      ::ng-deep .mat-stepper-horizontal-line { border-top-color: var(--border) !important; }

      /* ── Conteúdo do step ── */
      ::ng-deep .mat-step-content,
      ::ng-deep .mat-horizontal-content-container {
        background: transparent !important;
      }

      /* ── Form fields — texto e label ── */
      ::ng-deep .mat-mdc-form-field {
        .mat-mdc-text-field-wrapper {
          background: var(--input-bg) !important;
        }
        .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__leading,
        .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__notch,
        .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__trailing {
          border-color: var(--border) !important;
        }
        .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__leading,
        .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__notch,
        .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__trailing {
          border-color: var(--primary) !important;
        }
        .mdc-floating-label, .mat-mdc-floating-label {
          color: var(--text-sec) !important;
        }
        .mdc-text-field__input, input, textarea {
          color: var(--text) !important;
          caret-color: var(--accent) !important;
        }
        /* date input — calendário ícone e texto */
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.7);
        }
      }

      /* ── Select ── */
      ::ng-deep .mat-mdc-select-value-text,
      ::ng-deep .mat-mdc-select-arrow {
        color: var(--text) !important;
      }
      ::ng-deep .mat-mdc-select-panel {
        background: var(--surface) !important;
        .mat-mdc-option { color: var(--text) !important; }
        .mat-mdc-option:hover,
        .mat-mdc-option.mat-mdc-option-active { background: var(--row-hover) !important; }
      }

      /* ── Slide toggle label ── */
      ::ng-deep .mdc-label { color: var(--text) !important; }
    }

    .step-form { padding: 20px 0 8px; display: flex; flex-direction: column; gap: 4px; }

    .section-title {
      font-size: 13px; font-weight: 600; letter-spacing: .8px;
      text-transform: uppercase; color: var(--label, #7986cb);
      margin: 16px 0 8px; padding-bottom: 6px;
      border-bottom: 1px solid var(--border);
    }

    .form-row {
      display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start;
    }

    .field-full { width: 100%; }
    .field-grow { flex: 1; min-width: 180px; }

    .toggle-row {
      display: flex; align-items: center; gap: 12px; padding: 6px 0;
    }

    .toggle-col {
      display: flex; flex-direction: column; gap: 8px; padding: 8px 0;
    }

    .list-item {
      background: var(--input-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
      align-items: center;
    }

    .add-btn { margin: 4px 0 12px; }

    .divider { margin: 20px 0; }

    .step-actions {
      display: flex; justify-content: flex-end; gap: 8px;
      padding-top: 16px; margin-top: 8px;
      border-top: 1px solid var(--border);
    }

    .btn-submit {
      height: 48px; padding: 0 32px;
      display: flex; align-items: center; gap: 8px;
      font-size: 14px; font-weight: 600;
    }

    .security-info {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; border-radius: 8px; margin-bottom: 8px;
      background: rgba(61,90,254,.08); border: 1px solid rgba(61,90,254,.2);
      color: var(--text-sec); font-size: 13px;
      mat-icon { color: #7986cb; flex-shrink: 0; }
    }

    .security-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 12px; margin-bottom: 8px;
    }

    .security-item {
      background: var(--input-bg);
      border: 1px solid var(--border);
      border-radius: 8px; padding: 12px 16px;
    }

    /* Resultado */
    .result-card {
      border-radius: 12px; padding: 20px;
      border: 1px solid;
      &.success {
        background: rgba(102,187,106,.08);
        border-color: rgba(102,187,106,.3);
        .result-header { color: #66bb6a; }
      }
      &.failed {
        background: rgba(239,83,80,.08);
        border-color: rgba(239,83,80,.3);
        .result-header { color: #ef5350; }
      }
    }

    .result-header {
      display: flex; align-items: center; gap: 10px;
      font-size: 16px; font-weight: 600; margin-bottom: 12px;
    }

    .app-id {
      font-size: 12px; font-family: monospace;
      background: rgba(255,255,255,.1); border-radius: 4px;
      padding: 2px 8px; margin-left: 8px;
    }

    .result-msg { font-size: 14px; color: var(--text-sec); margin-bottom: 10px; }

    .error-list {
      padding-left: 20px; color: #ef5350; font-size: 13px;
      li { margin-bottom: 4px; }
    }

    .screenshot {
      width: 100%; border-radius: 8px; margin-top: 16px;
      border: 1px solid var(--border);
    }

    .feedback-banner {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 20px; border-radius: 10px; font-size: 14px;
      mat-icon { flex-shrink: 0; }
      &.error { background: rgba(239,83,80,.10); border: 1px solid rgba(239,83,80,.30); color: #ef5350; }
    }
  `]
})
export class DS160Component {
  private fb = inject(FormBuilder);
  private service = inject(DS160Service);

  loading = signal(false);
  result  = signal<DS160Response | null>(null);
  error   = signal<string | null>(null);

  // ── Forms por seção ──────────────────────────────────────────
  personalForm = this.fb.group({
    surname: ['', Validators.required],
    givenName: ['', Validators.required],
    fullNameNativeAlphabet: [''],
    hasOtherNames: [false],
    otherSurname: [''], otherGivenName: [''],
    sex: ['M', Validators.required],
    maritalStatus: ['S', Validators.required],
    dateOfBirth: ['', Validators.required],
    cityOfBirth: ['', Validators.required],
    stateOfBirth: [''],
    countryOfBirth: ['BRAZIL', Validators.required],
    nationality: ['BRAZIL', Validators.required],
    hasOtherNationality: [false], otherNationality: [''],
    isPermanentResidentOtherCountry: [false], permanentResidentCountry: [''],
    nationalIdNumber: [''],
    hasUsSocialSecurity: [false], usSocialSecurityNumber: [''],
    hasUsTaxId: [false], usTaxId: [''],
  });

  addressForm = this.fb.group({
    homeAddressLine1: ['', Validators.required],
    homeAddressLine2: [''],
    homeAddressCity: ['', Validators.required],
    homeAddressState: [''],
    homeAddressPostalCode: [''],
    homeAddressCountry: ['BRAZIL', Validators.required],
    homePhone: ['', Validators.required],
    mobilePhone: [''], workPhone: [''],
    email: ['', [Validators.required, Validators.email]],
  });

  passportForm = this.fb.group({
    passportType: ['B'],
    passportNumber: ['', Validators.required],
    passportBookNumber: [''],
    passportCountry: ['BRAZIL', Validators.required],
    passportIssuanceCity: ['', Validators.required],
    passportIssuanceState: [''],
    passportIssuanceCountry: ['BRAZIL', Validators.required],
    passportIssuanceDate: ['', Validators.required],
    passportExpirationDate: ['', Validators.required],
    hasLostOrStolenPassport: [false],
    lostPassportNumber: [''], lostPassportCountry: [''], lostPassportExplanation: [''],
  });

  travelForm = this.fb.group({
    travelPurpose: ['B'],
    specificTravelPurpose: [''],
    intendedArrivalDate: [''],
    intendedLengthOfStay: ['30 DAYS'],
    usAddressLine1: [''], usAddressLine2: [''],
    usAddressCity: [''], usAddressState: [''], usAddressZip: [''],
    travelFundingSource: ['SELF'], travelFundingDetails: [''],
    hasTravelCompanions: [false],
  });

  usHistoryForm = this.fb.group({
    hasBeenInUsBefore: [false],
    hasBeenIssuedUsVisa: [false],
    hasUsVisaRefused: [false], visaRefusedExplanation: [''],
    hasImmigrantPetition: [false],
  });

  usContactForm = this.fb.group({
    usContactSurname: ['', Validators.required],
    usContactGivenName: ['', Validators.required],
    usContactOrganization: [''],
    usContactRelationship: ['FRIEND'],
    usContactAddressLine1: ['', Validators.required],
    usContactAddressLine2: [''],
    usContactCity: ['', Validators.required],
    usContactState: ['', Validators.required],
    usContactZip: ['', Validators.required],
    usContactPhone: ['', Validators.required],
    usContactEmail: [''],
  });

  familyForm = this.fb.group({
    fatherSurname: [''], fatherGivenName: [''],
    fatherDateOfBirth: [''], fatherIsUsNational: [false],
    motherSurname: [''], motherGivenName: [''],
    motherDateOfBirth: [''], motherIsUsNational: [false],
    spouseSurname: [''], spouseGivenName: [''],
    spouseDateOfBirth: [''], spouseNationality: [''],
    spouseCityOfBirth: [''], spouseCountryOfBirth: [''],
    spouseAddressLine1: [''], spouseAddressCity: [''], spouseAddressCountry: [''],
    hasRelativeInUs: [false],
  });

  workForm = this.fb.group({
    primaryOccupation: ['EMPLOYED'],
    employerSchoolName: [''],
    employerSchoolAddressLine1: [''],
    employerSchoolCity: [''], employerSchoolCountry: [''],
    employerSchoolPhone: [''],
    employmentStartDate: [''],
    monthlyIncome: [''], jobDescription: [''],
    highestLevelOfEducation: ['U'],
    institutionName: [''], institutionCity: [''], institutionCountry: [''],
    courseOfStudy: [''], studyStartDate: [''], studyEndDate: [''],
  });

  securityForm = this.fb.group({
    hasCommunicableDisease: [false], hasMentalDisorder: [false], hasDrugAbuser: [false],
    hasArrestedOrConvicted: [false], hasControlledSubstanceViolation: [false],
    hasProstitution: [false], hasMoneyLaundering: [false], hasHumanTrafficking: [false],
    hasTerroristActivities: [false], hasGenocide: [false],
    hasTortureOrViolence: [false], hasChildSoldier: [false],
    hasReligiousFreedomViolation: [false], hasSignificantTraffickerInPersons: [false],
    hasIllegallyInUs: [false], hasViolatedVisaTerms: [false], hasDeported: [false],
    hasAttendedChildCustody: [false], hasVotedInUs: [false],
    hasRenounceUsNationality: [false], hasTaxEvasion: [false],
    securityExplanation: [''],
  });

  // ── FormArrays dinâmicos ─────────────────────────────────────
  companions   = this.fb.array<FormGroup>([]);
  usTravels    = this.fb.array<FormGroup>([]);
  previousVisas = this.fb.array<FormGroup>([]);
  usRelatives  = this.fb.array<FormGroup>([]);

  addCompanion()    { this.companions.push(this.fb.group({ surname: [''], givenName: [''], relationship: [''] })); }
  addUsTravel()     { this.usTravels.push(this.fb.group({ arrivalDate: [''], lengthOfStay: [''] })); }
  addPreviousVisa() { this.previousVisas.push(this.fb.group({ visaNumber: [''], issuanceDate: [''], isVisaInPassport: [false], isVisaSameType: [false], hasBeenTenPrinted: [false] })); }
  addUsRelative()   { this.usRelatives.push(this.fb.group({ surname: [''], givenName: [''], status: [''], relationship: [''] })); }

  submit() {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    const p = this.personalForm.value;
    const a = this.addressForm.value;
    const pp = this.passportForm.value;
    const t = this.travelForm.value;
    const h = this.usHistoryForm.value;
    const c = this.usContactForm.value;
    const f = this.familyForm.value;
    const w = this.workForm.value;
    const s = this.securityForm.value;

    const payload: any = {
      applicationLocation: 'BRAZIL SAO PAULO',
      ...p, ...a, ...pp, ...t, ...h, ...c, ...f, ...w, ...s,
      travelCompanions: this.companions.value,
      previousUsTravel: this.usTravels.value,
      previousUsVisas: this.previousVisas.value,
      usRelatives: this.usRelatives.value,
    };

    this.service.submit(payload).subscribe({
      next: (res) => { this.result.set(res); this.loading.set(false); },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Erro ao enviar o formulário DS-160.');
        this.loading.set(false);
      }
    });
  }
}
