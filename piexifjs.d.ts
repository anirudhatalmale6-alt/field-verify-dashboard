declare module 'piexifjs' {
  const GPSIFD: {
    GPSLatitudeRef: number;
    GPSLatitude: number;
    GPSLongitudeRef: number;
    GPSLongitude: number;
    GPSAltitudeRef: number;
    GPSAltitude: number;
    GPSDateStamp: number;
    GPSTimeStamp: number;
  };
  function dump(exifObj: Record<string, unknown>): string;
  function insert(exifBytes: string, dataUri: string): string;
  function load(dataUri: string): Record<string, unknown>;
  function remove(dataUri: string): string;
}
