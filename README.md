# REST API для блог-платформы с использованием Prisma ORM и SQLite

## Установка и запуск

1. Установить зависимости

```
npm i
```

2. Создать файл `.env` на основе `.env.example`

3. Для создания секретов можно использовать:

```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

4. Применить миграции:

```
npx prisma migrate deploy
```

5. Сгенерировать Prisma Client:

```
npx prisma generate
```

6. Запустить сервер:

```
npm run dev
```

