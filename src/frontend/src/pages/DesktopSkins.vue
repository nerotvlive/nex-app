<script setup lang="ts">
import SkinEditor from "../components/skineditor/SkinEditor.vue";
import SkinViewer3D from "../components/skineditor/SkinViewer3D.vue";
import SkinThumbnail from "../components/skineditor/SkinThumbnail.vue";
import type {SkinCharacter, SkinOutfit, SkinSource} from "../assets/zyneon/scripts/skineditor";
import {capeThumbnail, canUseLibraryFiles, fetchPlayerCapes, type PlayerCape, createCharacter, createOutfitFrom, deleteEntry, editOutfits, importOutfit, loadLibrary, openLibraryFolder, openSkinFile, openSkinFolder, outfitNameOf, outfitSource, playerTexture, renameEntry, renameOutfit, syncPlayerSkin, uuidKey} from "../assets/zyneon/scripts/skineditor";
import {computed, nextTick, onBeforeUnmount, onMounted, ref} from "vue";
import DesktopSideMenu from "../components/shared/DesktopSideMenu.vue";
import {useI18n} from "vue-i18n";
import {WindowControls} from "../assets/zyneon/scripts";

const username = "nichtnerotvlive"
const uuid = "6447757f-59fe-4206-ae3f-dc68ff2bb6f0"

const { t } = useI18n();
const view = ref("library");
const skinSource = ref<SkinSource | null>(null);
const bundledSkins: string[] = [
  "/assets/zyneon/img/skins/Alex (Classic).nexskin",
  "/assets/zyneon/img/skins/Alex (Slim).nexskin",
  "/assets/zyneon/img/skins/Ari (Classic).nexskin",
  "/assets/zyneon/img/skins/Ari (Slim).nexskin",
  "/assets/zyneon/img/skins/Efe (Classic).nexskin",
  "/assets/zyneon/img/skins/Efe (Slim).nexskin",
  "/assets/zyneon/img/skins/Kai (Classic).nexskin",
  "/assets/zyneon/img/skins/Kai (Slim).nexskin",
  "/assets/zyneon/img/skins/Makena (Classic).nexskin",
  "/assets/zyneon/img/skins/Makena (Slim).nexskin",
  "/assets/zyneon/img/skins/Mark Mann (Classic).nexskin",
  "/assets/zyneon/img/skins/Mark Mann (Slim).nexskin",
  "/assets/zyneon/img/skins/Noor (Classic).nexskin",
  "/assets/zyneon/img/skins/Noor (Slim).nexskin",
  "/assets/zyneon/img/skins/Steve (Classic).nexskin",
  "/assets/zyneon/img/skins/Steve (Slim).nexskin",
  "/assets/zyneon/img/skins/Sunny (Classic).nexskin",
  "/assets/zyneon/img/skins/Sunny (Slim).nexskin",
  "/assets/zyneon/img/skins/Zuri (Classic).nexskin",
  "/assets/zyneon/img/skins/Zuri (Slim).nexskin"
];


const defaultSkin = "/assets/zyneon/img/skins/Steve (Classic).nexskin";
const characters = ref<SkinCharacter[]>([]);
const selectedCharacterId = ref<string | null>(null);
const selectedOutfitId = ref<string | null>(null);
const search = ref("");
const error = ref<string | null>(null);
const renaming = ref<{ path: string, value: string } | null>(null);
const confirmDelete = ref<{ path: string, name: string, character: boolean } | null>(null);
const playerName = ref(username);
const playerKey = uuidKey(uuid);
const capes = ref<PlayerCape[]>([]);
const capeImages = ref<Record<string, string>>({});
const selectedCapeId = ref<string | null>(null);
const capeKey = 'nexapp.skins.cape.' + uuid;
const libraryFiles = canUseLibraryFiles();

const selectedCharacter = computed(() => characters.value.find(character => character.id === selectedCharacterId.value) ?? null);
const selectedOutfit = computed(() => selectedCharacter.value?.outfits.find(outfit => outfit.id === selectedOutfitId.value) ?? null);
const isPlayer = (character: SkinCharacter | null) => !!character && !!playerKey && character.uuid === playerKey;
const libraryNames = () => playerKey ? {[playerKey]: playerName.value} : {};
const viewerCape = computed(() => capes.value.find(cape => cape.id === selectedCapeId.value)?.bytes ?? null);
const capeName = (cape: PlayerCape) => cape.alias ?? t("pages.skins.capes.current");
const characterName = (character: SkinCharacter) => character.loose ? t("pages.skins.library.loose") : character.name;
const matches = (character: SkinCharacter) => {
  const query = search.value.trim().toLowerCase();
  return !query || characterName(character).toLowerCase().includes(query) || character.outfits.some(outfit => outfit.name.toLowerCase().includes(query));
};
const bundledCharacters = computed(() => characters.value.filter(character => character.bundled && matches(character)));
const savedCharacters = computed(() => characters.value.filter(character => !character.bundled && matches(character)));

const report = (cause: unknown) => {
  console.error('[Skins]', cause);
  error.value = String((cause as Error)?.message ?? cause);
};

const reload = async (characterId: string | null = selectedCharacterId.value, outfitPath: string | null = null) => {
  const previousOutfit = selectedOutfit.value;
  characters.value = await loadLibrary(bundledSkins, libraryNames());
  const fallback = characters.value.find(entry => entry.outfits.some(outfit => outfit.source === defaultSkin));
  const character = characters.value.find(entry => entry.id === characterId || (!!outfitPath && entry.outfits.some(outfit => outfit.path === outfitPath))) ?? fallback ?? characters.value[0] ?? null;
  const outfit = character?.outfits.find(entry => (outfitPath && entry.path === outfitPath) || (!outfitPath && previousOutfit && (entry.id === previousOutfit.id || (!!previousOutfit.path && entry.path === previousOutfit.path))))
      ?? character?.outfits.find(entry => entry.source === defaultSkin) ?? null;
  selectCharacter(character, outfit);
};

const selectCharacter = (character: SkinCharacter | null, outfit: SkinOutfit | null = null) => {
  selectedCharacterId.value = character?.id ?? null;
  void selectOutfit(outfit ?? character?.outfits[0] ?? null);
};

const selectOutfit = async (outfit: SkinOutfit | null) => {
  selectedOutfitId.value = outfit?.id ?? null;
  if (!outfit) {
    skinSource.value = null;
    return;
  }
  try {
    const source = await outfitSource(outfit);
    if (selectedOutfitId.value === outfit.id) skinSource.value = source;
  } catch (cause) {
    report(cause);
  }
};

const run = async (action: () => Promise<unknown>) => {
  try {
    await action();
  } catch (cause) {
    report(cause);
  }
};

const startRename = async (path: string | null, value: string) => {
  if (!path) return;
  renaming.value = {path, value};
  await nextTick();
  const input = document.querySelector<HTMLInputElement>('.skins-rename');
  input?.focus();
  input?.select();
};

const commitRename = () => run(async () => {
  const entry = renaming.value;
  renaming.value = null;
  if (!entry || !entry.value.trim()) return;
  const character = selectedCharacter.value;
  if (!character) return;
  if (character.path === entry.path) {
    await reload(await renameEntry(entry.path, entry.value.trim()));
    return;
  }
  const outfit = character.outfits.find(item => item.path === entry.path);
  if (!outfit) return;
  await reload(null, await renameOutfit(character, outfit, entry.value.trim()));
});

const newCharacter = () => run(async () => {
  const path = await createCharacter(t("pages.skins.library.newCharacterName"));
  await reload(path);
  await startRename(path, selectedCharacter.value?.name ?? "");
});

const addOutfit = () => run(async () => {
  const character = selectedCharacter.value;
  if (!character) return;
  const file = await openSkinFile();
  if (!file) return;
  const path = await importOutfit(character, outfitNameOf(file.name.replace(/\.(png|nexskin)$/i, "")), file.bytes);
  await reload(null, path);
});

const createOutfit = () => run(async () => {
  const character = selectedCharacter.value;
  const outfit = selectedOutfit.value;
  if (!character) return;
  const name = outfit ? t("pages.skins.library.createdName", {name: outfit.name}) : t("pages.skins.library.newOutfit");
  const path = await createOutfitFrom(character, outfit, name, t("pages.skineditor.layers.defaultName", {number: 1}));
  await reload(null, path);
});

const askDelete = (path: string | null, name: string, character: boolean) => {
  if (path) confirmDelete.value = {path, name, character};
};

const remove = () => run(async () => {
  const entry = confirmDelete.value;
  confirmDelete.value = null;
  if (!entry) return;
  await deleteEntry(entry.path);
  await reload(entry.character && !selectedCharacter.value?.bundled ? null : selectedCharacterId.value);
});

const onConfirmKey = (event: KeyboardEvent) => {
  if (!confirmDelete.value) return;
  if (event.key === 'Escape') confirmDelete.value = null;
  else if (event.key === 'Enter') void remove();
  else return;
  event.preventDefault();
};

const selectPlayer = (texture: string | null) => {
  const character = characters.value.find(entry => isPlayer(entry));
  if (!character) return;
  const outfit = texture ? character.outfits.find(entry => !!entry.path && /[\\/]([^\\/]+)\.nexskin$/i.exec(entry.path)?.[1] === texture) ?? null : null;
  selectCharacter(character, outfit);
};

const syncPlayer = () => run(async () => {
  const result = await syncPlayerSkin(username, uuid, characters.value);
  if (!result) return;
  const renamed = playerName.value !== result.name;
  playerName.value = result.name;
  if (result.changed || renamed) characters.value = await loadLibrary(bundledSkins, libraryNames());
  selectPlayer(result.texture);
});

const selectCape = (id: string | null) => {
  selectedCapeId.value = id;
  try {
    localStorage.setItem(capeKey, id ?? 'none');
  } catch {
    console.warn('[Skins] Could not remember the cape');
  }
};

const loadCapes = () => run(async () => {
  capes.value = await fetchPlayerCapes(uuid);
  for (const cape of capes.value) capeImages.value[cape.id] = await capeThumbnail(cape.id, cape.bytes);
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(capeKey);
  } catch {
    stored = null;
  }
  if (stored === 'none') selectedCapeId.value = null;
  else selectedCapeId.value = capes.value.find(cape => cape.id === stored)?.id ?? capes.value.find(cape => cape.active)?.id ?? null;
});

const onFocus = () => void reload().catch(report);

onMounted(async () => {
  window.addEventListener('focus', onFocus);
  window.addEventListener('keydown', onConfirmKey);
  await run(() => reload());
  selectPlayer(playerTexture(uuid));
  await Promise.all([syncPlayer(), loadCapes()]);
});

onBeforeUnmount(() => {
  window.removeEventListener('focus', onFocus);
  window.removeEventListener('keydown', onConfirmKey);
});
</script>

<template>
  <div class="flex w-full h-full" v-if="view === 'library'">
    <DesktopSideMenu class="h-full skins-menu active small zyn-ov-brighter" style="border-right: 1px solid var(--zyn-ov-brighter-200);">
      <template #top>
        <div class="flex items-center" @mousedown.stop>
          <strong class="zyn-foreground-alt" style="padding: 0.475rem 1rem;">
            {{ t("pages.skins.title") }}
          </strong>
        </div>
      </template>
      <template #center>
        <SkinViewer3D class="h-90" :source="skinSource" :cape="viewerCape"/>
        <div v-if="selectedCharacter && selectedOutfit" class="skins-current" @mousedown.stop>
          <strong class="zyn-foreground-alt truncate">{{ selectedCharacter.name }}</strong>
          <span class="truncate">{{ selectedOutfit.name }}</span>
        </div>
        <div v-if="capes.length" class="skins-capes" @mousedown.stop>
          <span class="skins-capes-title">{{ t("pages.skins.capes.title") }}</span>
          <div class="skins-capes-grid">
            <button class="skins-cape" :class="{'active': !selectedCapeId}" :title="t('pages.skins.capes.none')" @click="selectCape(null)"><i class="bi bi-x-lg"></i></button>
            <button v-for="cape in capes" :key="cape.id" class="skins-cape" :class="{'active': cape.id === selectedCapeId}" :title="capeName(cape)" @click="selectCape(cape.id)">
              <img v-if="capeImages[cape.id]" :src="capeImages[cape.id]" alt="" draggable="false">
            </button>
          </div>
        </div>
      </template>
      <template #bottom>
        <div class="pt-2" @mousedown.stop>
          <div class="flex pt-2" style="margin-right: 0; border-top: 1px solid var(--zyn-ov-brighter-200);">
            <a class="zyn-btn compact" @click="WindowControls.openSecondaryFrame('/skineditor')">
              <i class="bi bi-palette"></i>
              <span class="grow">{{ t("pages.skins.menu.openEditor") }}</span>
            </a>
          </div>
        </div>
      </template>
    </DesktopSideMenu>

    <div class="skins-content">
      <div v-if="error" class="skins-error">
        <i class="bi bi-exclamation-triangle"></i>
        <span class="grow">{{ error }}</span>
        <button @click="error = null"><i class="bi bi-x-lg"></i></button>
      </div>

      <section v-if="selectedCharacter" class="skins-section">
        <header class="skins-header">
          <input v-if="renaming && renaming.path === selectedCharacter.path" v-model="renaming.value" class="skins-rename" spellcheck="false" @keydown.enter="commitRename" @keydown.escape="renaming = null" @blur="commitRename">
          <h2 v-else :title="selectedCharacter.bundled || selectedCharacter.loose || selectedCharacter.uuid ? '' : t('pages.skins.library.renameHint')" @dblclick="!selectedCharacter.bundled && !selectedCharacter.loose && !selectedCharacter.uuid && startRename(selectedCharacter.path, selectedCharacter.name)">{{ characterName(selectedCharacter) }}</h2>
          <span v-if="selectedCharacter.bundled" class="skins-badge">{{ t("pages.skins.library.example") }}</span>
          <span v-if="isPlayer(selectedCharacter)" class="skins-badge">{{ t("pages.skins.library.player") }}</span>
          <div class="grow"></div>
          <template v-if="!selectedCharacter.bundled">
            <button class="zyn-btn compact darker" :title="t('pages.skins.library.editCharacterHint')" @click="editOutfits(selectedCharacter.outfits)"><i class="bi bi-pencil"></i><span>{{ t("pages.skins.library.edit") }}</span></button>
            <button v-if="libraryFiles && (selectedCharacter.path || selectedCharacter.loose)" class="zyn-btn compact darker" :title="t('pages.skins.library.openFolder')" @click="selectedCharacter.path ? openLibraryFolder(selectedCharacter.path) : openSkinFolder()"><i class="bi bi-folder2-open"></i></button>
            <button v-if="!selectedCharacter.loose" class="zyn-btn compact darker" :title="t('pages.skins.library.deleteCharacter')" @click="askDelete(selectedCharacter.path, selectedCharacter.name, true)"><i class="bi bi-trash"></i></button>
          </template>
        </header>
        <div class="skins-outfits">
          <div v-for="outfit in selectedCharacter.outfits" :key="outfit.id" class="skins-outfit" :class="{'active': outfit.id === selectedOutfitId}" @click="selectOutfit(outfit)">
            <SkinThumbnail :outfit="outfit"/>
            <input v-if="renaming && renaming.path === outfit.path" v-model="renaming.value" class="skins-rename" spellcheck="false" @click.stop @keydown.enter="commitRename" @keydown.escape="renaming = null" @blur="commitRename">
            <span v-else class="skins-outfit-name" :title="outfit.bundled ? outfit.name : t('pages.skins.library.renameHint')" @dblclick.stop="!outfit.bundled && startRename(outfit.path, outfit.name)">{{ outfit.name }}</span>
            <div v-if="!outfit.bundled" class="skins-outfit-actions">
              <button :title="t('pages.skins.library.edit')" @click.stop="editOutfits([outfit])"><i class="bi bi-pencil"></i></button>
              <button :title="t('pages.skins.library.deleteOutfit')" @click.stop="askDelete(outfit.path, outfit.name, false)"><i class="bi bi-trash"></i></button>
            </div>
          </div>
          <div v-if="libraryFiles && !selectedCharacter.loose" class="skins-outfit skins-add">
            <button :title="t('pages.skins.library.addOutfitHint')" @click="addOutfit"><i class="bi bi-upload"></i><span>{{ t("pages.skins.library.addOutfit") }}</span></button>
            <button :title="t(selectedOutfit ? 'pages.skins.library.createOutfitHint' : 'pages.skins.library.createEmptyOutfitHint')" @click="createOutfit"><i class="bi bi-plus-lg"></i><span>{{ t("pages.skins.library.createOutfit") }}</span></button>
          </div>
        </div>
      </section>

      <div class="skins-toolbar">
        <input v-model="search" type="text" class="zyn-btn darker compact outline-none skins-search" :placeholder="t('pages.skins.library.search')">
        <div class="grow"></div>
        <button v-if="libraryFiles" class="zyn-btn compact darker" @click="newCharacter"><i class="bi bi-person-plus"></i><span>{{ t("pages.skins.library.newCharacter") }}</span></button>
        <button v-if="libraryFiles" class="zyn-btn compact darker" :title="t('pages.skins.library.openSkinsFolder')" @click="openSkinFolder"><i class="bi bi-folder2-open"></i></button>
      </div>

      <section v-for="group in [{id: 'saved', characters: savedCharacters}, {id: 'bundled', characters: bundledCharacters}]" :key="group.id" class="skins-section">
        <header class="skins-header">
          <h2>{{ t("pages.skins.library.groups." + group.id) }}</h2>
          <span class="skins-count">{{ group.characters.length }}</span>
        </header>
        <div v-if="group.characters.length" class="skins-grid">
          <button v-for="character in group.characters" :key="character.id" class="skins-character" :class="{'active': character.id === selectedCharacterId}" @click="selectCharacter(character)">
            <SkinThumbnail :outfit="character.outfits[0] ?? null"/>
            <strong class="truncate">{{ characterName(character) }}</strong>
            <div class="skins-meta">
              <span>{{ t("pages.skins.library.outfitCount", {count: character.outfits.length}, character.outfits.length) }}</span>
              <span v-if="isPlayer(character)" class="skins-badge">{{ t("pages.skins.library.player") }}</span>
            </div>
          </button>
        </div>
        <p v-else class="skins-empty">{{ t(group.id === 'saved' ? "pages.skins.library.emptySaved" : "pages.skins.library.emptySearch") }}</p>
      </section>
    </div>
  </div>
  <div v-if="confirmDelete" class="skins-dialog-backdrop" @mousedown.self="confirmDelete = null">
    <div class="skins-dialog" role="dialog">
      <strong>{{ t(confirmDelete.character ? "pages.skins.library.deleteCharacterTitle" : "pages.skins.library.deleteOutfitTitle") }}</strong>
      <p>{{ t(confirmDelete.character ? "pages.skins.library.deleteCharacterText" : "pages.skins.library.deleteOutfitText", {name: confirmDelete.name}) }}</p>
      <footer>
        <button class="zyn-btn compact darker" @click="confirmDelete = null">{{ t("pages.skins.library.cancel") }}</button>
        <button class="zyn-btn compact skins-danger" @click="remove"><i class="bi bi-trash"></i><span>{{ t("pages.skins.library.delete") }}</span></button>
      </footer>
    </div>
  </div>
  <SkinEditor v-if="view === 'editor'"/>
</template>

<style scoped>
.skins-current {
  display: flex;
  flex-direction: column;
  padding: 0 1rem 0.5rem;
  font-size: 0.8rem;
  line-height: 1.3;
  opacity: 0.85;
}

.skins-capes {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.5rem 1rem 0.75rem;
  border-top: 1px solid var(--zyn-ov-brighter-200);
}

.skins-capes-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.6;
}

.skins-capes-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.35rem;
}

.skins-cape {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 10 / 16;
  padding: 0.25rem;
  border-radius: var(--zyn-br-sm);
  background: var(--zyn-ov-brighter-100);
  border: 1px solid var(--zyn-ov-brighter-200);
  color: var(--zyn-foreground);
  cursor: pointer;
  transition: var(--zyn-transition);

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    image-rendering: pixelated;
  }

  &:hover {
    background: var(--zyn-ov-brighter-200);
  }

  &.active {
    background: var(--zyn-ov-brighter-300);
    border-color: var(--zyn-ov-brighter-400);
  }
}

.skins-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  min-width: 0;
  padding: 1.25rem;
  overflow-y: auto;
}

.skins-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skins-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2rem;

  h2 {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--zyn-foreground-alt);
  }

  .zyn-btn {
    margin: 0;
    width: fit-content;
    gap: 0.4rem;
  }
}

.skins-search {
  width: 14rem;
  margin: 0;
}

.skins-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .zyn-btn {
    margin: 0;
    width: fit-content;
    gap: 0.4rem;
  }
}

.skins-count {
  font-size: 0.8rem;
  opacity: 0.6;
}

.skins-empty {
  font-size: 0.85rem;
  opacity: 0.6;
}

.skins-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0007;
}

.skins-dialog {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: min(26rem, calc(100% - 2rem));
  padding: 1rem 1.1rem;
  border-radius: var(--zyn-br-md, 0.5rem);
  background: var(--zyn-background-color, #202020);
  border: 1px solid var(--zyn-ov-brighter-200);
  box-shadow: 0 16px 40px #0009;

  strong {
    font-size: 1rem;
    color: var(--zyn-foreground-alt);
  }

  p {
    font-size: 0.85rem;
    opacity: 0.85;
  }

  footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .zyn-btn {
    margin: 0;
    width: fit-content;
    gap: 0.4rem;
  }
}

.skins-danger {
  background: color-mix(in srgb, var(--zyn-danger, #e5484d) 45%, transparent) !important;
  color: white;
}

.skins-rename {
  min-width: 0;
  padding: 0.1rem 0.4rem;
  border-radius: var(--zyn-br-sm);
  background: var(--zyn-ov-darker-300);
  border: 1px solid var(--zyn-ov-brighter-300);
  color: var(--zyn-foreground-alt);
  outline: none;
}

.skins-badge {
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  font-size: 0.65rem;
  background: var(--zyn-ov-brighter-200);
  color: var(--zyn-foreground);
}

.skins-outfits {
  display: flex;
  gap: 0.6rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.skins-outfit, .skins-character {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.6rem;
  border-radius: var(--zyn-br-md, 0.5rem);
  background: var(--zyn-ov-brighter-100);
  border: 1px solid var(--zyn-ov-brighter-200);
  cursor: pointer;
  transition: var(--zyn-transition);

  &:hover {
    background: var(--zyn-ov-brighter-200);
  }

  &.active {
    background: var(--zyn-ov-brighter-300);
    border-color: var(--zyn-ov-brighter-400);
  }
}

.skins-outfit {
  flex: 0 0 7rem;
  font-size: 0.8rem;

  .skin-thumbnail {
    height: 7rem;
  }

  .skins-rename {
    width: 100%;
  }

  &:hover .skins-outfit-actions {
    opacity: 1;
  }
}

.skins-outfit-name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skins-outfit-actions {
  position: absolute;
  top: 0.3rem;
  right: 0.3rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  opacity: 0;
  transition: var(--zyn-transition);

  button {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: var(--zyn-br-sm);
    background: var(--zyn-ov-darker-300);
    font-size: 0.7rem;
    cursor: pointer;

    &:hover {
      background: var(--zyn-ov-brighter-300);
    }
  }
}

.skins-add {
  justify-content: stretch;
  gap: 0.4rem;
  padding: 0;
  background: none;
  border: none;
  cursor: default;

  &:hover {
    background: none;
  }

  button {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    width: 100%;
    padding: 0.4rem;
    border-radius: var(--zyn-br-md, 0.5rem);
    background: var(--zyn-ov-brighter-100);
    border: 1px dashed var(--zyn-ov-brighter-300);
    font-size: 0.75rem;
    text-align: center;
    color: var(--zyn-foreground);
    cursor: pointer;
    transition: var(--zyn-transition);

    i {
      font-size: 1.1rem;
    }

    &:hover:not(:disabled) {
      background: var(--zyn-ov-brighter-200);
      color: var(--zyn-foreground-alt);
    }

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }
}

.skins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
  gap: 0.75rem;
}

.skins-character {
  font-size: 0.8rem;

  .skin-thumbnail {
    height: 8rem;
  }

  strong {
    max-width: 100%;
    color: var(--zyn-foreground-alt);
    font-size: 0.9rem;
  }

}

.skins-meta {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.skins-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--zyn-br-sm);
  background: color-mix(in srgb, var(--zyn-danger, #e5484d) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--zyn-danger, #e5484d) 45%, transparent);
  font-size: 0.85rem;

  button {
    cursor: pointer;
  }
}
</style>