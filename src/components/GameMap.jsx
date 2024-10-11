import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const GameMap = () => {
  const [mapData, setMapData] = useState(null); // Данные карты
  const canvasRef = useRef(null); // Ссылка на canvas
  const [scale, setScale] = useState(1); // Масштаб карты
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // Смещение карты
  const [selectedCarpetIndex, setSelectedCarpetIndex] = useState(0); // Индекс выбранного ковра
  const [drag, setDrag] = useState({ isDragging: false, startX: 0, startY: 0 }); // Состояние для перемещения карты

  // Функция для запроса данных
  const getMapData = async () => {
    try {
      const response = await axios.post(
        'https://games-test.datsteam.dev/play/magcarp/player/move',
        {
          transports: [
            {
              acceleration: { x: 0, y: 0 }, // Примерное значение ускорения
              activateShield: false, // Примерное значение щита
              attack: { x: 0, y: 0 }, // Примерное значение атаки
              id: '00000000-0000-0000-0000-000000000000', // ID ковра
            },
          ],
        },
        {
          headers: {
            'X-Auth-Token': '67091e754514f67091e7545153',
            'Content-Type': 'application/json',
          },
        }
      );

      // Сохраняем данные карты, включая новые координаты ковров
      setMapData(response.data);
    } catch (error) {
      console.error('Ошибка при получении данных карты:', error);
    }
  };

  // Функция для отрисовки объектов на карте
  const drawMap = (ctx, anomalies, transports, enemies, bounties, mapSize) => {
    const mapWidth = ctx.canvas.width;
    const mapHeight = ctx.canvas.height;

    ctx.clearRect(0, 0, mapWidth, mapHeight); // Очищаем canvas

    const scaleX = (mapWidth / mapSize.x) * scale; // Учитываем масштаб при отрисовке по X
    const scaleY = (mapHeight / mapSize.y) * scale; // Учитываем масштаб при отрисовке по Y

    // Применяем смещение карты (offset)
    ctx.translate(offset.x, offset.y);

    // Отрисовка аномалий
    anomalies.forEach((anomaly) => {
      const { x, y, radius, strength } = anomaly;
      ctx.beginPath();
      ctx.arc(x * scaleX, y * scaleY, radius * scale, 0, 2 * Math.PI);
      ctx.fillStyle = strength > 0 ? 'rgba(255, 0, 0, 0.4)' : 'rgba(0, 0, 255, 0.4)'; // Красные — притягивающие, синие — отталкивающие
      ctx.fill();
      ctx.strokeStyle = 'black'; // Граница аномалий
      ctx.stroke();
    });

    // Отрисовка ковров игроков
    transports.forEach((transport, index) => {
      const { x, y, health } = transport;
      ctx.beginPath();
      ctx.arc(x * scaleX, y * scaleY, 10 * scale, 0, 2 * Math.PI); // Радиус ковра
      ctx.fillStyle = index === selectedCarpetIndex ? 'purple' : 'green'; // Фиолетовый для выбранного ковра
      ctx.fill();
      ctx.strokeStyle = 'black'; // Граница ковра
      ctx.stroke();

      // Отрисовка здоровья
      ctx.font = `${12 * scale}px Arial`;
      ctx.fillStyle = 'black';
      ctx.fillText(`HP: ${health}`, x * scaleX - 10, y * scaleY - 15); // Подпись здоровья
    });

    // Отрисовка врагов (огненные враги)
    enemies.forEach((enemy) => {
      const { x, y, health } = enemy;
      const gradient = ctx.createRadialGradient(x * scaleX, y * scaleY, 5, x * scaleX, y * scaleY, 15);
      gradient.addColorStop(0, 'blue');
      gradient.addColorStop(1, 'red');
      ctx.beginPath();
      ctx.arc(x * scaleX, y * scaleY, 15 * scale, 0, 2 * Math.PI); // Радиус врага
      ctx.fillStyle = gradient; // Огненный градиент
      ctx.fill();
      ctx.strokeStyle = 'black'; // Граница врага
      ctx.stroke();

      // Отрисовка здоровья врага
      ctx.font = `${12 * scale}px Arial`;
      ctx.fillStyle = 'black';
      ctx.fillText(`HP: ${health}`, x * scaleX - 10, y * scaleY - 20); // Подпись здоровья врага
    });

    // Отрисовка золота (bounties)
    bounties.forEach((bounty) => {
      const { x, y, radius } = bounty;
      ctx.beginPath();
      ctx.arc(x * scaleX, y * scaleY, radius * scale, 0, 2 * Math.PI);
      ctx.fillStyle = 'gold'; // Цвет золота
      ctx.fill();
      ctx.strokeStyle = 'black';
      ctx.stroke();
    });

    // Сбрасываем трансформацию после рисования
    ctx.resetTransform();
  };

  useEffect(() => {
    const intervalId = setInterval(getMapData, 1500); // Обновляем данные каждые 1000ms
    return () => clearInterval(intervalId); // Очищаем таймер при размонтировании компонента
  }, []);

  useEffect(() => {
    if (mapData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      drawMap(
        ctx,
        mapData.anomalies || [],
        mapData.transports || [], // Используем данные о коврах из ответа сервера
        mapData.enemies || [],
        mapData.bounties || [], // Золото
        mapData.mapSize || { x: 800, y: 800 } // Размер карты
      ); // Отрисовка карты
    }
  }, [mapData, scale, offset]);

  // Функция для управления масштабированием карты колесом мыши
  const handleWheel = (e) => {
    const zoomAmount = 0.1; // Количество изменения масштаба при прокрутке
    const mouseX = e.clientX - canvasRef.current.getBoundingClientRect().left; // Позиция мыши по X
    const mouseY = e.clientY - canvasRef.current.getBoundingClientRect().top;  // Позиция мыши по Y

    if (e.deltaY < 0 && scale < 2) {
      setOffset({
        x: offset.x - (mouseX / scale) * zoomAmount,
        y: offset.y - (mouseY / scale) * zoomAmount,
      });
      setScale(scale + zoomAmount); // Увеличиваем масштаб
    } else if (e.deltaY > 0 && scale > 0.5) {
      setOffset({
        x: offset.x + (mouseX / scale) * zoomAmount,
        y: offset.y + (mouseY / scale) * zoomAmount,
      });
      setScale(scale - zoomAmount); // Уменьшаем масштаб
    }
  };

  // Обработка нажатия клавиш для выбора ковров
  const handleKeyDown = (e) => {
    const carpetIndex = parseInt(e.key) - 1; // Переводим нажатую клавишу в индекс (1-5 в 0-4)

    if (mapData && mapData.transports && carpetIndex >= 0 && carpetIndex < mapData.transports.length) {
      setSelectedCarpetIndex(carpetIndex); // Устанавливаем индекс выбранного ковра
      const selectedCarpet = mapData.transports[carpetIndex]; // Получаем данные выбранного ковра
      // Центрируем выбранный ковер
      setOffset({
        x: -(selectedCarpet.x - 400), // Центрируем ковер в 400 пикселей по X
        y: -(selectedCarpet.y - 300), // Центрируем ковер в 300 пикселей по Y
      });
    }
  };

  // Обработка начала перетаскивания карты
  const handleMouseDown = (e) => {
    setDrag({ isDragging: true, startX: e.clientX, startY: e.clientY });
  };

  // Обработка перемещения карты
  const handleMouseMove = (e) => {
    if (drag.isDragging) {
      const deltaX = e.clientX - drag.startX;
      const deltaY = e.clientY - drag.startY;
      setOffset({ x: offset.x + deltaX, y: offset.y + deltaY });
      setDrag({ ...drag, startX: e.clientX, startY: e.clientY });
    }
  };

  // Завершение перетаскивания карты
  const handleMouseUp = () => {
    setDrag({ ...drag, isDragging: false });
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <canvas
        ref={canvasRef}
        width={3840} // Реальная ширина canvas 4K
        height={2160} // Реальная высота canvas 4K
        style={{ border: '1px solid black', width: '100vw', height: '100vh' }} // Визуальные размеры для экрана
        onWheel={handleWheel} // Обработка колеса мыши для масштабирования
        onMouseDown={handleMouseDown} // Начало перетаскивания
        onMouseMove={handleMouseMove} // Перемещение карты
        onMouseUp={handleMouseUp} // Окончание перетаскивания
      />
    </div>
  );
};

export default GameMap;
