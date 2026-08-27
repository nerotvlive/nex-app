export interface ApiStatus {
  service: string
  status: string
  version: string
  [key: string]: unknown
}
