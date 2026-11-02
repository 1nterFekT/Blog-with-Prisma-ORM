# REST API для блог-платформы с использованием Prisma ORM и SQLite

## Установка и запуск

1. Установить зависимости

```
npm i
```

2. Создать файл `.env` на основе `.env.example`

3. Применить миграции:

```
npx prisma migrate deploy
```

4. Сгенерировать Prisma Client:

```
npx prisma generate
```

5. Запустить сервер:

```
npm run dev
```

