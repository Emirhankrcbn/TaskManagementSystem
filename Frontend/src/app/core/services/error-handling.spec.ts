import { TestBed } from '@angular/core/testing';

import { ErrorHandling } from './error-handling';

describe('ErrorHandling', () => {
  let service: ErrorHandling;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorHandling);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
