# Как собрать JAR через IDE

## IntelliJ IDEA (рекомендуется)

### Способ 1: Через Maven панель (самый простой)

1. **Откройте проект** в IntelliJ IDEA
   - File → Open → выберите папку `backend`

2. **Откройте Maven панель**:
   - Справа найдите вкладку **"Maven"** (или View → Tool Windows → Maven)
   - Если не видите, нажмите `Alt + 2`

3. **Соберите `common-dto`**:
   - В Maven панели найдите: `common-dto` → `Lifecycle`
   - Двойной клик на: **`install`** (или правой кнопкой → Run Maven Goal → `clean install`)

4. **Соберите `statistics-service`**:
   - В Maven панели найдите: `statistics-service` → `Lifecycle`
   - Двойной клик на: **`package`** (или правой кнопкой → Run Maven Goal → `clean package`)

5. **Готово!** JAR будет в: `backend/statistics-service/target/statisticsservice.jar`

---

### Способ 2: Через Maven цели (Command)

1. Откройте Maven панель (Alt + 2)

2. В `statistics-service` → `Plugins` → `spring-boot`:
   - Найдите `spring-boot:repackage` и запустите (двойной клик)

Или:

3. Вверху справа найдите **"Maven"** → нажмите на него → выберите Maven Goals

4. Введите команды:
   ```
   clean package
   ```

---

## VS Code

1. Установите расширение **"Extension Pack for Java"** (Microsoft)

2. Откройте папку `backend/statistics-service`

3. Откройте терминал в VS Code (`Ctrl + '`)

4. Выполните:
   ```bash
   # Сначала соберите common-dto
   cd ../common-dto
   ./mvnw.cmd clean install
   
   # Затем statistics-service
   cd ../statistics-service
   ./mvnw.cmd clean package
   ```

---

## Eclipse

1. Откройте проект: File → Import → Existing Maven Projects

2. Выберите папку `backend/statistics-service`

3. Правой кнопкой на проекте → **Run As** → **Maven install** (для `common-dto`)
   - Затем **Maven package** (для `statistics-service`)

---

## После сборки JAR

После успешной сборки пересоберите Docker образ:

```powershell
cd backend
docker-compose build statistics-service
docker-compose up -d statistics-service
```

---

**Примечание:** Если сборка не удается из-за зависимости `common-dto`, сначала соберите `common-dto` (шаг 3), а затем `statistics-service` (шаг 4).
