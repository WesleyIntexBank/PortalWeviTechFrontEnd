import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TravelCompanion { surname: string; givenName: string; relationship: string; }
export interface UsTravelHistory { arrivalDate: string; lengthOfStay: string; }
export interface PreviousUsVisa { visaNumber: string; issuanceDate: string; isVisaInPassport: boolean; isVisaSameType: boolean; hasBeenTenPrinted: boolean; }
export interface UsRelative { surname: string; givenName: string; status: string; relationship: string; }

export interface DS160Request {
  applicationLocation: string;
  // Personal I
  surname: string; givenName: string; fullNameNativeAlphabet: string;
  hasOtherNames: boolean; otherSurname?: string; otherGivenName?: string;
  sex: string; maritalStatus: string;
  dateOfBirth: string; cityOfBirth: string; stateOfBirth?: string; countryOfBirth: string;
  nationality: string; hasOtherNationality: boolean; otherNationality?: string;
  isPermanentResidentOtherCountry: boolean; permanentResidentCountry?: string;
  nationalIdNumber?: string;
  hasUsSocialSecurity: boolean; usSocialSecurityNumber?: string;
  hasUsTaxId: boolean; usTaxId?: string;
  // Address
  homeAddressLine1: string; homeAddressLine2?: string;
  homeAddressCity: string; homeAddressState?: string;
  homeAddressPostalCode?: string; homeAddressCountry: string;
  homePhone: string; mobilePhone?: string; workPhone?: string; email: string;
  // Passport
  passportType: string; passportNumber: string; passportBookNumber?: string;
  passportCountry: string; passportIssuanceCity: string;
  passportIssuanceState?: string; passportIssuanceCountry: string;
  passportIssuanceDate: string; passportExpirationDate: string;
  hasLostOrStolenPassport: boolean; lostPassportNumber?: string;
  lostPassportCountry?: string; lostPassportExplanation?: string;
  // Travel
  travelPurpose: string; specificTravelPurpose?: string;
  intendedArrivalDate?: string; intendedLengthOfStay: string;
  usAddressLine1?: string; usAddressLine2?: string;
  usAddressCity?: string; usAddressState?: string; usAddressZip?: string;
  travelFundingSource: string; travelFundingDetails?: string;
  // Companions
  hasTravelCompanions: boolean; travelCompanions?: TravelCompanion[];
  // US History
  hasBeenInUsBefore: boolean; previousUsTravel?: UsTravelHistory[];
  hasBeenIssuedUsVisa: boolean; previousUsVisas?: PreviousUsVisa[];
  hasUsVisaRefused: boolean; visaRefusedExplanation?: string;
  hasImmigrantPetition: boolean;
  // US Contact
  usContactSurname: string; usContactGivenName: string;
  usContactOrganization?: string; usContactRelationship: string;
  usContactAddressLine1: string; usContactAddressLine2?: string;
  usContactCity: string; usContactState: string; usContactZip: string;
  usContactPhone: string; usContactEmail?: string;
  // Family
  fatherSurname: string; fatherGivenName: string;
  fatherDateOfBirth?: string; fatherIsUsNational: boolean;
  motherSurname: string; motherGivenName: string;
  motherDateOfBirth?: string; motherIsUsNational: boolean;
  hasRelativeInUs: boolean; usRelatives?: UsRelative[];
  spouseSurname?: string; spouseGivenName?: string;
  spouseDateOfBirth?: string; spouseNationality?: string;
  spouseCityOfBirth?: string; spouseCountryOfBirth?: string;
  spouseAddressLine1?: string; spouseAddressCity?: string; spouseAddressCountry?: string;
  // Work/Education
  primaryOccupation: string; employerSchoolName?: string;
  employerSchoolAddressLine1?: string; employerSchoolCity?: string;
  employerSchoolCountry?: string; employerSchoolPhone?: string;
  employmentStartDate?: string; monthlyIncome?: string; jobDescription?: string;
  highestLevelOfEducation: string; institutionName?: string;
  institutionCity?: string; institutionCountry?: string;
  courseOfStudy?: string; studyStartDate?: string; studyEndDate?: string;
  // Security
  hasCommunicableDisease: boolean; hasMentalDisorder: boolean; hasDrugAbuser: boolean;
  hasArrestedOrConvicted: boolean; hasControlledSubstanceViolation: boolean;
  hasProstitution: boolean; hasMoneyLaundering: boolean; hasHumanTrafficking: boolean;
  hasTerroristActivities: boolean; hasGenocide: boolean;
  hasTortureOrViolence: boolean; hasChildSoldier: boolean;
  hasReligiousFreedomViolation: boolean; hasSignificantTraffickerInPersons: boolean;
  hasIllegallyInUs: boolean; hasViolatedVisaTerms: boolean; hasDeported: boolean;
  hasAttendedChildCustody: boolean; hasVotedInUs: boolean;
  hasRenounceUsNationality: boolean; hasTaxEvasion: boolean;
  securityExplanation?: string;
}

export interface DS160Response {
  success: boolean;
  applicationId?: string;
  statusMessage?: string;
  currentPage?: string;
  errors: string[];
  screenshotBase64?: string;
}

@Injectable({ providedIn: 'root' })
export class DS160Service {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/DS160`;

  submit(req: DS160Request): Observable<DS160Response> {
    return this.http.post<DS160Response>(`${this.base}/submit`, req);
  }

  getStatus(applicationId: string): Observable<DS160Response> {
    return this.http.get<DS160Response>(`${this.base}/status/${applicationId}`);
  }
}
