export type Item = {
	id: string;

	w: number;
	h: number;
	x: number;
	y: number;

	mobileW: number;
	mobileH: number;
	mobileX: number;
	mobileY: number;

	cardType: string;

	color?: string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	cardData: any;

	updatedAt?: string;

	version?: number;
};
