export interface Listen {
	listened_at: number;
	track_metadata: {
		artist_name: string;
		track_name: string;
		release_name?: string;
		additional_info?: {
			release_mbid?: string;
		};
	};
}

export interface ReleaseGroup {
	release_group_mbid: string;
	release_group_name: string;
	artist_name: string;
	artist_mbids?: string[];
	listen_count: number;
	caa_id?: number;
	caa_release_mbid?: string;
}

export interface Artist {
	artist_name: string;
	artist_mbid?: string;
	listen_count: number;
}

export interface Recording {
	track_name: string;
	recording_mbid?: string;
	artist_name: string;
	artist_mbids?: string[];
	release_name?: string;
	release_mbid?: string;
	caa_release_mbid?: string;
	listen_count: number;
}
