# Pretty Works Frontend

Pretty Works Frontend 프로젝트입니다.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- React Query (TanStack Query)
- Axios
- Zustand

## Installation

프로젝트를 실행하기 전에 의존성을 설치합니다.

```bash
npm install
```

## Run

개발 서버를 실행합니다.

```bash
npm run dev
```

브라우저에서 아래 주소로 접속합니다.

```
http://localhost:3000
```

## Project Structure

```
src
├── app
├── api
├── components
├── features
├── layouts
├── lib
├── styles
└── ...
```

## 주요 라이브러리

### Axios

HTTP 통신

```bash
npm install axios
```

### React Query

서버 상태 관리

```bash
npm install @tanstack/react-query
```

### Zustand

전역 상태 관리

```bash
npm install zustand
```

### Lucide React

아이콘

```bash
npm install lucide-react
```

## Scripts

```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 실행
npm run lint     # ESLint 실행
```