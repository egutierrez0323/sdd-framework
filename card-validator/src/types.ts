export type CardBrand = 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'UNKNOWN';

export interface CardInput {
  cardNumber: string;
  expMonth?: number;
  expYear?: number;
  cvv?: string;
}

export interface CardValidationResult {
  isValid: boolean;
  brand: CardBrand;
  luhnValid: boolean;
  expirationValid?: boolean;
  cvvValid?: boolean;
  errors: string[];
}
