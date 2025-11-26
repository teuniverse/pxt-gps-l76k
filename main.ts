/**
 * GPS block for DFRobot Gravity GNSS-GPS Module - I2C and UART - L76K
 * See also: https://wiki.dfrobot.com/SKU_TEL0157_Gravity_GNSS_Positioning_Module
 */

/**
 * Gps blocks
 */
//% weight=100 color=#0fbc11 icon="\uf1d8" block="GPS (L76K)"
namespace GPS_L76K {
  let I2C_ADDRESS = 0x20;

  // Date
  let year = 0;
  let month = 0;
  let day = 0;

  // UTC time
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  let latitudeDegree = 0.0;
  let longitudeDegree = 0.0;

  // Registers
  let I2C_GNSS_MODE_REGISTER = 34;
  let I2C_SLEEP_MODE_REGISTER = 35;
  let I2C_RGB_MODE_REGISTER = 36;

  function writeRegister(register: number, value: number) {
    let buffer = pins.createBuffer(2);
    buffer[0] = register;
    buffer[1] = value;
    pins.i2cWriteBuffer(I2C_ADDRESS, buffer);
  }

  function readRegister(register: number, len: number): Buffer {
    let writeBuf = pins.createBuffer(1);
    writeBuf[0] = register;

    // Send register address
    let result = pins.i2cWriteBuffer(I2C_ADDRESS, writeBuf);
    if (result != 0) {
      // Nonzero means error in MakeCode runtime
      return pins.createBuffer(0);
    }

    // Read len bytes back
    return pins.i2cReadBuffer(I2C_ADDRESS, len);
  }

  function padNumber(num: number, size: number): string {
    let s = "" + num;
    while (s.length < size) {
      s = "0" + s;
    }
    return s;
  }

  function getCoordinateDegreeFromRawData(
    rawData: Buffer,
    disRaw: Buffer,
    disNegative: string
  ): number {
    let dd = rawData[0];
    let mm = rawData[1];
    let mmmm = (rawData[2] << 16) | (rawData[3] << 8) | rawData[4];
    //let coordinate = dd * 100.0 + mm + (mmmm / 100000.0)
    let degree = dd + mm / 60.0 + mmmm / 100000.0 / 60.0;

    if (disRaw[0] == disNegative.charCodeAt(0)) {
      degree *= -1;
    }
    return degree;
  }

  /**
   * Set RGB on
   */
  //% block
  export function setRgbOn(): void {
    let RGB_ON = 0x05;
    writeRegister(I2C_RGB_MODE_REGISTER, RGB_ON);
  }

  /**
   * Set RGB off
   */
  //% block
  export function setRgbOff(): void {
    let RGB_OFF = 0x02;
    writeRegister(I2C_RGB_MODE_REGISTER, RGB_OFF);
  }

  /**
   * Update Date
   */
  //% block
  export function updateDate(): void {
    let I2C_YEAR_H_REGISTER = 0;
    let result = readRegister(I2C_YEAR_H_REGISTER, 4);

    year = (result[0] << 8) | result[1];
    month = result[2];
    day = result[3];
  }

  /**
   * Get date
   */
  //% block
  export function getDate(): string {
    return (
      padNumber(day, 2) + "-" + padNumber(month, 2) + "-" + padNumber(year, 4)
    );
  }

  /**
   * Get day
   */
  //% block
  export function getDay(): number {
    return day;
  }

  /**
   * Get month
   */
  //% block
  export function getMonth(): number {
    return month;
  }

  /**
   * Get year
   */
  //% block
  export function getYear(): number {
    return year;
  }

  /**
   * Update Utc
   */
  //% block
  export function updateUtc(): void {
    let I2C_HOUR_REGISTER = 4;
    let result = readRegister(I2C_HOUR_REGISTER, 3);

    hours = result[0];
    minutes = result[1];
    seconds = result[2];
  }

  /**
   * Get Utc time
   */
  //% block
  export function getUtcTime(): string {
    return (
      padNumber(hours, 2) +
      ":" +
      padNumber(minutes, 2) +
      ":" +
      padNumber(seconds, 2)
    );
  }

  /**
   * Get hours
   */
  //% block
  export function getHours(): number {
    return hours;
  }

  /**
   * Get minutes
   */
  //% block
  export function getMinutes(): number {
    return minutes;
  }

  /**
   * Get seconds
   */
  //% block
  export function getSeconds(): number {
    return seconds;
  }

  /**
   * Update coordinates
   */
  //% block
  export function updateCoordinates(): void {
    // Latitude
    let I2C_LAT_1_REGISTER = 7;
    let latitudeRaw = readRegister(I2C_LAT_1_REGISTER, 6);
    let I2C_LAT_DIS_REGISTER = 18;
    let latitudeDisRaw = readRegister(I2C_LAT_DIS_REGISTER, 1);
    latitudeDegree = getCoordinateDegreeFromRawData(
      latitudeRaw,
      latitudeDisRaw,
      "S"
    ); // 'S'=neg, 'N'=pos

    // Longitude
    let I2C_LON_1_REGISTER = 13;
    let longitudeRaw = readRegister(I2C_LON_1_REGISTER, 6);
    let I2C_LON_DIS_REGISTER = 12;
    let longitudeDisRaw = readRegister(I2C_LON_DIS_REGISTER, 1);
    longitudeDegree = getCoordinateDegreeFromRawData(
      longitudeRaw,
      longitudeDisRaw,
      "W"
    ); // 'W'=neg, 'E'=pos
  }

  /**
   * Get latitude degree
   */
  //% block
  export function getLatitudeDegree(): number {
    return latitudeDegree;
  }

  /**
   * Get longitude degree
   */
  //% block
  export function getLongitudeDegree(): number {
    return longitudeDegree;
  }

  /**
   * Set satellite count
   */
  //% block
  export function getSatelliteCount(): number {
    let I2C_USE_STAR_REGISTER = 19;
    let result = readRegister(I2C_USE_STAR_REGISTER, 1);
    return result[0];
  }

  /**
   * Get gnss mode
   */
  //% block
  export function getGnssMode(): number {
    /*
        typedef enum {
        eGPS=1,
        eBeiDou,
        eGPS_BeiDou, // 3 = default
        eGLONASS,
        eGPS_GLONASS,
        eBeiDou_GLONASS,
        eGPS_BeiDou_GLONASS,
        } eGnssMode_t;
        */
    let result = readRegister(I2C_GNSS_MODE_REGISTER, 1);
    return result[0];
  }

  /**
   * Set gnss mode
   */
  //% block
  export function setGnssMode(mode: number): void {
    writeRegister(I2C_GNSS_MODE_REGISTER, mode);
  }

  /**
   * Enable power
   */
  //% block
  export function enablePower(): void {
    let ENABLE_POWER = 0x0;
    writeRegister(I2C_SLEEP_MODE_REGISTER, ENABLE_POWER);
  }

  /**
   * Disable power
   */
  //% block
  export function disablePower(): void {
    let DISABLE_POWER = 0x1;
    writeRegister(I2C_SLEEP_MODE_REGISTER, DISABLE_POWER);
  }
}
