# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tiny Wins is a 35-day habit-forming web service based on neuroscience (S-R/R-O brain system transition over 5 weeks). Users track daily habits across a 35-day cycle, with progress visualization and social comparison features. The full product spec is in `tiny_wins.md`.

## Commands

```bash
npm run dev      # 프론트엔드 개발 서버 (Vite, :5173)
npm run server   # API 서버 (Express, :3001)
npm run dev:all  # 둘 다 동시 실행
npm run build    # 프로덕션 빌드 → dist/
npm run lint     # ESLint
```

## Tech Stack

- **Frontend**: React 19 + Vite, TailwindCSS v4, Recharts, Zustand, React Router
- **Backend**: Express + JSON 파일 저장 (data/ 폴더)
- **Deploy**: 라즈베리파이 (별도 네트워크)

## Project Structure

```
src/
  pages/        # 라우트 페이지 (Setup, Dashboard)
  components/   # 재사용 컴포넌트
  stores/       # Zustand 스토어 (useUserStore, useHabitStore)
  lib/          # API 클라이언트 (api.js)
  hooks/        # 커스텀 훅
server/
  index.js      # Express API 서버
  db.js         # JSON 파일 읽기/쓰기 유틸
data/           # JSON 데이터 파일 (gitignored)
```

## Color Theme (단계별)

| 단계 | 배경 | 텍스트 | 포인트1 | 포인트2 |
|------|------|--------|---------|---------|
| 초기 (Day 1-7) | `#F0C3C4` | `#F9F5F3` | `#BB8DB9` | `#A6A18C` |
| 중기 (Day 8-35) | `#C2DEE9` | `#2E4C92` | `#E9BF99` | `#93BDE2` |
| 후기 (Day 36+) | `#5B3054` | `#F2ECE3` | `#B8503C` | `#D3AB70` |

공통: Charcoal `#2d2d2d`, Cream `#faf8f4`

Tailwind 접두사: `early-`, `mid-`, `late-` (예: `bg-early-bg`, `text-mid-text`, `bg-late-point1`)

## Key Domain Concepts

- **Habit Set**: A 35-day (5-week) collection of habits a user tracks together
- **S-R habits**: Stimulus-Response (time/place-based, automate faster)
- **R-O habits**: Response-Outcome (goal-based, need sustained motivation)
- **Phases**: Day 1-7 (initial/goal-oriented), Day 8-35 (transition), Day 36+ (automated)
- **"Gyeolgi" (겨루기)**: Social comparison feature showing only graph shapes, no habit details

## Data Model

Four main entities: Users, Habit_Sets (5-week periods), Habits (within a set, typed as S-R/R-O/mixed), Daily_Records (date + completed habit IDs), Friendships. See `tiny_wins.md` for full schemas. Data is stored as JSON files in `data/`.
