export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  requestId: string;
  errorCode?: string;
}

export interface PageInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

/** Raw backend pagination — matches Spring Page and PagedContent shapes. */
export interface RawPagedResponse<T> {
  content: T[];
  page?: PageInfo;
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  last?: boolean;
}

/** Flat pagination shape consumed by components. */
export interface PagedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export namespace PagedResponse {
  /** Normalise any backend pagination shape into the flat PagedResponse. */
  export function from<T>(raw: RawPagedResponse<T>): PagedResponse<T> {
    const content = raw.content ?? [];
    const totalElements = raw.totalElements ?? raw.page?.totalElements ?? 0;
    const totalPages = raw.totalPages ?? raw.page?.totalPages ?? 1;
    const pageSize = raw.size ?? raw.page?.size ?? 20;
    const pageNumber = raw.number ?? raw.page?.number ?? 0;
    return {
      content,
      pageNumber,
      pageSize,
      totalElements,
      totalPages,
      last: raw.last ?? pageNumber >= totalPages - 1,
    };
  }
}
