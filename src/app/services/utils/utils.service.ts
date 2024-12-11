import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor() {}

  transformDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  areDatesEqual(date1: string, date2: string): boolean {
    const formatDate = (date: string) => date.split('T')[0];
    return formatDate(date1) === formatDate(date2);
  }

  areArraysEqual(arr1: any[], arr2: any[]): boolean {
    if (arr1.length !== arr2.length) {
      return false;
    }
    const sortedArr1 = [...arr1].sort();
    const sortedArr2 = [...arr2].sort();
    return sortedArr1.every((value, index) => value === sortedArr2[index]);
  }

  isNumber(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  parseIntValue(value: any): any {
    const parsedValue = parseInt(value, 10);
    return isNaN(parsedValue) ? '' : parsedValue;
  }

  calculateStatDifference(currentValue: number, previousValue: number): string {
    if (previousValue === undefined) {
      return '0';
    }
    const difference = (currentValue - previousValue).toFixed(2);
    if (Number(difference) === 0) {
      return '0';
    }
    const percentageChange = previousValue === 0 ? '' : ((Number(difference) / previousValue) * 100).toFixed(2);
    const differenceWithSign = Number(difference) > 0 ? `+${difference}` : difference;
    return previousValue === 0 ? `${differenceWithSign}` : `${differenceWithSign} (${percentageChange}%)`;
  }

  getArrowIcon(currentValue: number, previousValue?: number): string {
    if (previousValue === undefined || currentValue === undefined) {
      return '';
    }
    if (currentValue === previousValue) {
      return '';
    }
    return currentValue > previousValue ? 'arrow-up' : 'arrow-down';
  }

  getDiffColor(currentValue: number, previousValue?: number): string {
    if (previousValue === undefined || currentValue === undefined) {
      return '';
    }
    if (currentValue === previousValue) {
      return '';
    }
    return currentValue > previousValue ? 'success' : 'danger';
  }
}
