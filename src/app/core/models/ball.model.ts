export interface Ball {
  availability: string;
  ball_id: string;
  ball_image: string;
  ball_name: string;
  brand_id: string;
  brand_name: string;
  core_diff: string;
  core_id: string;
  core_image: string;
  core_int_diff: string;
  core_name: string;
  core_rg: string;
  core_type: string;
  core_weight: string;
  coverstock_id: string;
  coverstock_name: string;
  coverstock_type: string;
  factory_finish: string;
  last_update: string;
  release_date: string;
  thumbnail_image: string;
  us_int: string;
  position?: number;
}

export interface Core {
  core_name: string;
  brand: string;
  id: string;
  api_filter_url: string;
}

export interface Coverstock {
  coverstock_name: string;
  brand: string;
  id: string;
  api_filter_url: string;
}

export interface Brand {
  brand_name: string;
  id: string;
  logo: string;
}
