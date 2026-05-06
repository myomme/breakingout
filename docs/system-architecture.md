# Breaking Out BoardGame - Current Architecture

## Entry Points

- `mapmaker.html`: 대형 전술 Hex 맵 에디터
- `game.html`: 레이드 게임 프로토타입

`index.html`은 현재 사용하지 않는다. 에디터 작업은 `mapmaker.html`, 게임 테스트는 `game.html`에서 진행한다.

## Main Folders

```text
/
  mapmaker.html
  game.html
  styles/
    main.css
    game.css
  src/
    main.js
    core/
      hex.js
      gameState.js
      spawnSlots.js
    editor/
      brushes.js
      gridGenerator.js
      historyStack.js
    render/
      canvasMapEditor.js
      tileTextures.js
      hexMapRenderer.js
    game/
      mapDataAdapter.js
      gameState.js
      gameRenderer.js
      gamePrototype.js
  data/
    maps/
    rules/
  assets/
    cards/
    map/
    tile/
    ui/
```

## Map Editor Status

The map editor is canvas-based and currently supports:

- 대형 Hex Grid 생성
- 휠 줌
- Space + Drag 화면 이동
- 미니맵 네비게이터
- 브러시 기반 타일 페인팅
- 브러시 반경 0, 1, 2, 3, 5, 8
- Shift 직선 페인팅
- Alt 스포이드
- 타일 삭제/복구
- 레이어형 속성 편집
- 배경 이미지 업로드/제거
- 배경 스케일/위치 조정
- Grid 원점/크기/회전/불투명도 조정
- 스폰 슬롯 배치
- 스폰 슬롯과 탈출구 연결
- Editor JSON Export
- Game JSON Export
- JSON Import
- Undo / Redo

## Game Prototype Status

The game prototype currently supports:

- `mapData.game.json` Import
- Canvas 기반 레이드 맵 렌더링
- 배경 지도 렌더링
- 카메라 줌/이동
- 플레이어 2명
- 플레이어별 무기/방어구/가방 상태
- 순서 카드 기반 턴 순서
- 15페이즈, 3레이드 구조
- 자동 이동 비용 표시: 1칸 `-1`, 2~3칸 `-2`
- 타일 위 컨텍스트 액션 팝업
- 루팅
- 공격
- PvP 공격
- 무기별 피해/사거리/주사위
- 방어구 피해 감소/내구도
- 부위별 HP
- 엄폐/시야 차단
- 이벤트 카드 일부 효과
- 스폰 슬롯별 허용 탈출구
- 제한적 시야 표시
- 공격 주사위 오버레이
- 장비/이벤트/기타 드로어 UI

## High-Risk Items To Keep Clean

1. 한글 인코딩
   - HTML, JS 문자열, JSON `name`/`label` 값이 깨지면 UI와 로그가 바로 망가진다.
   - 모든 새 텍스트는 UTF-8로 저장한다.

2. Entry point naming
   - `index.html`이 아니라 `mapmaker.html`과 `game.html`을 기준으로 한다.

3. Data-driven rules
   - 무기, 방어구, 이벤트, 지형은 `data/rules/*.json`을 우선한다.
   - JS에는 가능한 표시/처리 로직만 둔다.

4. Editor export vs Game export
   - 에디터용 JSON은 복구 가능한 편집 정보를 보존한다.
   - 게임용 JSON은 실제 플레이에 필요한 enabled tile 중심으로 사용한다.

5. Board-first UI direction
   - 실제 행동은 오른쪽 메뉴보다 타일 위 팝업으로 이동 중이다.
   - 오른쪽 패널은 점점 상태 확인용으로 축소한다.

## Near-Term Roadmap

1. 깨진 텍스트/문서/데이터 정리
2. 오른쪽 메뉴 기능을 보드 위 팝업으로 이전
3. 플레이어별 탈출/사망/잔류 결과 정리
4. 3레이드 종료 후 최종 승자 판정
5. 아이템 데이터와 인벤토리 이미지 슬롯 연결
6. 이벤트 카드 미구현 효과 마무리
7. 수동 테스트 체크리스트 작성
