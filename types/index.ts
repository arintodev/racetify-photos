// Types untuk aplikasi upload foto

export interface Event {
  id: string // INT in database
  name: string
  date?: string
  location?: string
  description?: string
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
  priority?: number
  worker_id?: string
  retry_count?: number
  error_message?: string
  created_at?: string
  started_at?: string
  finished_at?: string
}

export interface UploadProgress {
  file: File
  status: 'idle' | 'compressing' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  photoPath?: string
}

export interface UploadResponse {
  success: boolean
  photoPath?: string
  jobId?: string
  error?: string
}

export interface Photo {
  id: string
  event_id: string
  photographer_id: string
  photo_path: string
  location_id?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at?: string
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
