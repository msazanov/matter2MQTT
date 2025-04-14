import { Environment, singleton, Logger } from "@matter/main";
import { Ble } from "@matter/main/protocol";
import { NodeJsBle } from "@matter/nodejs-ble";

const logger = Logger.get("BleScanner");

// Инициализация окружения
const environment = Environment.default;

// Устанавливаем реализацию BLE для Node.js
Ble.get = singleton(() => 
  new NodeJsBle({
    hciId: environment.vars.number("ble.hci.id") // Опционально: ID адаптера BLE
  })
);


async function findMatterDevices() {
  logger.info("Начинаем поиск Matter-устройств через BLE...");
  
  // Получаем сканер BLE
  const bleScanner = Ble.get().getBleScanner();
  
  // Найти коммиссионные устройства (в режиме сопряжения)
  const devices = await bleScanner.findCommissionableDevices({}, 10); // 10 секунд поиска
  
  if (devices.length === 0) {
    logger.info("Устройства Matter не обнаружены");
    return;
  }
  
  logger.info(`Найдено ${devices.length} Matter-устройств:`);
  
  devices.forEach((device, index) => {
    logger.info(`Устройство ${index + 1}:`);
    logger.info(`  Идентификатор: ${device.deviceIdentifier}`);
    logger.info(`  Длинный дискриминатор: ${device.D}`);
    
    if (device.VP) {
      const [vendorId, productId] = device.VP.split('+');
      logger.info(`  Vendor ID: ${vendorId}`);
      logger.info(`  Product ID: ${productId}`);
    }
    
    if (device.addresses && device.addresses.length > 0) {
      const address = device.addresses[0];
      if (address.type === "ble" && 'peripheralAddress' in address) {
        logger.info(`  BLE адрес: ${address.peripheralAddress}`);
      }
    }
    
    logger.info('---');
  });
  
  // Для подключения к устройству нужно настроить интерфейс
  if (devices.length > 0 && devices[0].addresses && devices[0].addresses.length > 0) {
    const address = devices[0].addresses[0];
    if (address.type === "ble" && 'peripheralAddress' in address) {
      const bleInterface = Ble.get().getBleCentralInterface();
      
      // Установка обработчика для входящих сообщений
      const listener = bleInterface.onData((socket, data) => {
        logger.info(`Получено сообщение от ${socket.name}: ${data.length} байт`);
        // Обработка полученных данных
      });
      
      try {
        logger.info(`Попытка подключения к устройству: ${address.peripheralAddress}`);
        const channel = await bleInterface.openChannel(address);
        logger.info(`Успешно подключились к: ${channel.name}`);
        
        // Здесь можно работать с каналом - отправлять сообщения и т.д.
        // Например:
        // await channel.send(new Uint8Array([0x01, 0x02, 0x03]));
        
        // Ждем немного для демонстрации
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Не забудьте закрыть канал, когда закончите
        await channel.close();
      } catch (error) {
        logger.error("Ошибка при подключении:", error);
      } finally {
        // Закрываем слушатель
        await listener.close();
      }
    }
  }
  
  // Также можно непрерывно сканировать и получать уведомления о новых устройствах
  logger.info("Начинаем непрерывное сканирование...");
  await bleScanner.findCommissionableDevicesContinuously(
    {}, // Поиск любых устройств
    (device) => {
      logger.info(`Обнаружено новое устройство: ${device.deviceIdentifier}`);
    },
    30, // 30 секунд сканирования
  );
  
  // Закрываем сканер
  await bleScanner.close();
}

// Запуск функции
findMatterDevices()
  .catch(error => logger.error("Ошибка при поиске устройств:", error))
  .finally(() => process.exit(0));