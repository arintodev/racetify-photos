// Types untuk aplikasi upload foto

export interface Event {
  id: string // INT in database
  name: string
  date?: string
  location?: string
  description?: string
  photo_banner_path?: string,
  photo_banner_url?: string,
  created_at: string
}

export interface PhotoLocation {
  id: string
  event_id: string
  name: string
  created_at?: string
  updated_at?: string
}

export interface PhotoJob {
  id?: string
  event_id: string // INT in database
  photographer_id: string
  photo_path: string
  location_id?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  worker_id?: string
  error_message?: string
  created_at?: string
  started_at?: string
  finished_at?: string
}

export interface PhotoMeta {
  original_name: string,
  original_time?: Date | string | null,
  cam_make?: string | null,
  cam_model?: string | null,
  lens_model?: string | null,
  iso?: number | null,
  aperture?: number | null,
  exposure_time?: number | null,
  focal_length?: number | null
}

export interface UploadProgress {
  file: {file: File, meta: PhotoMeta},
  status: 'idle' | 'compressing' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  photoPath?: string
}

export interface UploadResponse {
  success: boolean,
  data?: any,
  error?: string
}

export interface Photo extends PhotoMeta {
  id: string
  event_id: string
  photographer_id: string
  photo_path: string
  location_id?: string
  created_at: string
  height?: number | null
  width?: number | null
  photo_locations?: {
    name: string
  }
}

export interface PhotoBib {
  id: string
  photo_id: string
  bib_number: string
  created_at?: string
}

export interface PhotoWithBibs extends Photo {
  photo_bibs?: PhotoBib[]
  public_url?: string
}
