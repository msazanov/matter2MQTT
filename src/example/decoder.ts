import { QrPairingCodeCodec, ManualPairingCodeCodec } from "@matter/types";

/**
 * Декодирует QR-код устройства Matter
 * @param code - Строка QR-кода для декодирования
 */
function decodeQrCode(code: string) {
  try {
    // Декодирование QR-кода с использованием специализированного кодека
    const decodedData = QrPairingCodeCodec.decode(code);
    
    // Вывод полной информации о декодированном QR-коде
    console.log('QR Code Decoded:', decodedData);
    
    // Дополнительная обработка TLV-данных, если они присутствуют
    if (decodedData[0].tlvData) {
      // Декодирование TLV (Tag-Length-Value) данных
      const tlvDecoded = QrPairingCodeCodec.decodeTlvData(decodedData[0].tlvData);
      console.log('TLV Data:', tlvDecoded);
    }
  } catch (error) {
    // Обработка ошибок при декодировании QR-кода
    console.error('QR Code Decoding Error:', error);
  }
}

/**
 * Декодирует ручной (Manual) код устройства Matter
 * @param code - Строка ручного кода для декодирования
 */
function decodeManualCode(code: string) {
  try {
    // Удаление дефисов из кода для унификации
    const cleanedCode = code.replace(/-/g, '');
    
    // Декодирование ручного кода с использованием специализированного кодека
    const decodedData = ManualPairingCodeCodec.decode(cleanedCode);
    
    // Вывод полной информации о декодированном ручном коде
    console.log('Manual Code Decoded:', decodedData);
  } catch (error) {
    // Обработка ошибок при декодировании ручного кода
    console.error('Manual Code Decoding Error:', error);
  }
}

/**
 * Определяет тип кода подключения
 * @param code - Код для определения типа
 * @returns Тип кода: 'qr', 'manual' или 'invalid'
 */
function determinePairingCodeType(code: string): 'qr' | 'manual' | 'invalid' {
  // Удаление дефисов для унификации проверки
  const cleanedCode = code.replace(/-/g, '');

  // Проверка QR-кода (начинается с 'MT:')
  if (code.startsWith('MT:')) {
    return 'qr';
  }
  
  // Проверка ручного кода (только цифры, длина 9 или 11 символов)
  if (/^\d+$/.test(cleanedCode) && (cleanedCode.length === 11 || cleanedCode.length === 9)) {
    return 'manual';
  }
  
  // Если код не соответствует известным форматам
  return 'invalid';
}

/**
 * Выводит справочную информацию об использовании скрипта
 */
function printHelp() {
  console.log('Matter Pairing Code Decoder');
  console.log('Usage: node dist/example/decoder.ts [pairing-code]');
  console.log('\nSupported Formats:');
  console.log('  1. QR Code: MT:G6BK2G0S02PVKZ4UL00');
  console.log('  2. Manual Code: 33648316578');
  console.log('  3. Formatted Manual Code: 3364-831-6578');
}

/**
 * Основная функция выполнения скрипта
 */
function main() {
  // Предопределенные примеры кодов для демонстрации
  const defaultQrCode = 'MT:G6BK2G0S02PVKZ4UL00';
  const defaultManualCode = '33648316578';

  // Получение кода из аргументов командной строки
  const code = process.argv[2];

  // Если код не передан, показываем справку и декодируем примеры
  if (!code) {
    printHelp();
    console.log('\nDecoding default QR and Manual Codes:\n');
    
    // Декодирование и вывод QR-кода по умолчанию
    console.log('Default QR Code:');
    decodeQrCode(defaultQrCode);
    
    // Декодирование и вывод ручного кода по умолчанию
    console.log('\nDefault Manual Code:');
    decodeManualCode(defaultManualCode);
    return;
  }

  // Определение типа переданного кода
  const codeType = determinePairingCodeType(code);

  // Обработка кода в зависимости от его типа
  switch (codeType) {
    case 'qr':
      console.log('Detected QR Code format');
      decodeQrCode(code);
      break;
    case 'manual':
      console.log('Detected Manual Code format');
      decodeManualCode(code);
      break;
    case 'invalid':
      // Вывод ошибки и справки при некорректном формате кода
      console.error('Invalid pairing code format');
      printHelp();
      break;
  }
}

// Запуск основной функции
main();