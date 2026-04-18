# Learnly Sync Guide (macOS v1 -> GitHub)

Этот файл делает синк повторяемым и безопасным.

## Что именно синкается

Источник:
- `/Users/moi/Desktop/business/learnly`

Назначение в удалённом репо:
- `learnly macOS v1 (ignore)/learnly copy`

## Быстрый запуск

```bash
cd /Users/moi/Desktop/business/learnly
./script/sync_macos_v1_to_remote.sh
```

Это:
1. обновит `main` в локальном клоне `learnly-remote`
2. создаст/обновит ветку `sync/macos-v1`
3. синкнет файлы через `rsync` в папку `learnly macOS v1 (ignore)/learnly copy`
4. закоммитит изменения (если они есть)
5. запушит `sync/macos-v1`
6. сделает fast-forward merge в `main` и запушит `main` (по умолчанию)

## Только ветка sync (без merge в `main`)

```bash
cd /Users/moi/Desktop/business/learnly
./script/sync_macos_v1_to_remote.sh --no-merge-main
```

## Без изменений (проверка, dry run)

```bash
cd /Users/moi/Desktop/business/learnly
./script/sync_macos_v1_to_remote.sh --dry-run
```

## Кастомные пути (если нужно)

```bash
./script/sync_macos_v1_to_remote.sh \
  --source "/Users/moi/Desktop/business/learnly" \
  --remote-clone "/Users/moi/Desktop/business/learnly-remote" \
  --target-subdir "learnly macOS v1 (ignore)/learnly copy"
```

## Важно

- Путь с пробелами и скобками уже корректно экранируется в скрипте.
- `gh` не нужен.
- Аутентификация идёт через обычный `git` + PAT/credential helper.
