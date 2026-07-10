import { TestBed } from '@angular/core/testing';
import { PaginatorComponent } from './paginator.component';
import { vi } from 'vitest';

describe('PaginatorComponent', () => {
  function setup(overrides: Partial<PaginatorComponent> = {}) {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new PaginatorComponent());
    Object.assign(component, {
      totalElements: 100,
      pageSize: 20,
      currentPage: 0,
      pageSizeOptions: [10, 20, 50],
      ...overrides,
    });
    return component;
  }

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  describe('totalPages', () => {
    it('should calculate from totalElements and pageSize', () => {
      expect(setup({ totalElements: 100, pageSize: 20 }).totalPages).toBe(5);
    });

    it('should return at least 1 page for empty data', () => {
      expect(setup({ totalElements: 0, pageSize: 20 }).totalPages).toBe(1);
    });

    it('should round up', () => {
      expect(setup({ totalElements: 101, pageSize: 20 }).totalPages).toBe(6);
    });
  });

  describe('startItem', () => {
    it('should start at 1 for first page', () => {
      expect(setup({ currentPage: 0, pageSize: 20 }).startItem).toBe(1);
    });

    it('should calculate offset for later pages', () => {
      expect(setup({ currentPage: 2, pageSize: 20 }).startItem).toBe(41);
    });
  });

  describe('endItem', () => {
    it('should be pageSize for non-last pages', () => {
      expect(setup({ currentPage: 0, pageSize: 20, totalElements: 50 }).endItem).toBe(20);
    });

    it('should cap at totalElements for last page', () => {
      expect(setup({ currentPage: 2, pageSize: 20, totalElements: 50 }).endItem).toBe(50);
    });
  });

  describe('visiblePages', () => {
    it('should center around current page', () => {
      const component = setup({ currentPage: 2, totalElements: 200, pageSize: 20 });
      expect(component.visiblePages).toEqual([0, 1, 2, 3, 4]);
    });

    it('should not go below page 0', () => {
      const component = setup({ currentPage: 0, totalElements: 200, pageSize: 20 });
      expect(component.visiblePages).toEqual([0, 1, 2, 3, 4]);
    });

    it('should not exceed totalPages', () => {
      const component = setup({ currentPage: 9, totalElements: 200, pageSize: 20 });
      expect(component.visiblePages).toEqual([5, 6, 7, 8, 9]);
    });
  });

  describe('goToPage', () => {
    it('should emit pageChange when navigating to a valid page', () => {
      const component = setup({ currentPage: 0, totalElements: 100, pageSize: 20 });
      const spy = vi.spyOn(component.pageChange, 'emit');
      component.goToPage(2);
      expect(spy).toHaveBeenCalledWith({ page: 2, size: 20 });
    });

    it('should not emit when navigating to the same page', () => {
      const component = setup({ currentPage: 2, totalElements: 100, pageSize: 20 });
      const spy = vi.spyOn(component.pageChange, 'emit');
      component.goToPage(2);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not emit for negative page', () => {
      const component = setup({ currentPage: 0, totalElements: 100, pageSize: 20 });
      const spy = vi.spyOn(component.pageChange, 'emit');
      component.goToPage(-1);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not emit for page beyond totalPages', () => {
      const component = setup({ currentPage: 0, totalElements: 100, pageSize: 20 });
      const spy = vi.spyOn(component.pageChange, 'emit');
      component.goToPage(5);
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
