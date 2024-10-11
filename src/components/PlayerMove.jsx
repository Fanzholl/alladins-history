import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PlayerMove = () => {
  const [responseData, setResponseData] = useState(null);

  // Функция для отправки данных
  const sendPlayerMove = async () => {
    try {
      const response = await axios.post(
        'https://games.datsteam.dev/play/magcarp/player/move',
        {
          headers: {
            'X-Auth-Token': '67091e754514f67091e7545153',
            'Content-Type': 'application/json'
          }
        },
        {body: {}},
      );

      // Сохранение ответа от сервера
      setResponseData(response.data);
    } catch (error) {
      console.error('Ошибка при отправке запроса:', error.response ? error.response.data : error.message);
    }
  };

  useEffect(() => {
    sendPlayerMove(); // Отправляем запрос при монтировании компонента
  }, []);

  return (
    <div>
      <h1>Данные после запроса</h1>
      {responseData ? (
        <pre>{JSON.stringify(responseData, null, 2)}</pre>
      ) : (
        <p>Загрузка...</p>
      )}
    </div>
  );
};

export default PlayerMove;
