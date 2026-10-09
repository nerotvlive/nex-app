<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {openExternal} from "../../../../assets/zyneon/scripts";
import CardCollapsable from "../CardCollapsable.vue";
import Badge from "../Badge.vue";
import {useI18n} from "vue-i18n";
const { t } = useI18n();

interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      date: string
    }
  }
  html_url: string
  author?: {
    avatar_url: string
  }
}

const owner = 'nerotvlive'
const repo = 'nex-app'
const branch = 'master'

const commits = ref<GitHubCommit[]>([])
const loading = ref<boolean>(true)
const error = ref<string | null>(null)

const fetchCommits = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}`
    )

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('ERROR: Git account, repository or branch not found.')
      }
      throw new Error(`Cannot load commit history: ${response.statusText}`)
    }

    commits.value = await response.json()
  } catch (err: any) {
    error.value = err.message || 'An unknown error occurred.'
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString(t('languages.auto.key'), {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchCommits()
})
</script>

<template>
  <div class="">
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="animate-pulse flex items-center space-x-4 p-3">
        <div class="rounded-full bg-zinc-800 h-10 w-10"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-zinc-800 rounded w-3/4"></div>
          <div class="h-3 bg-zinc-800 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <div v-else-if="error">
      <div class="flex gap-2">
        <CardCollapsable class="bg-red-500/50 flex-1" border="1px solid var(--zyn-ov-brighter-200)">
          <template #header>
            Error
          </template>
          <template #content>
            Message: {{ error }}
            <br><br>
            <button @click="fetchCommits" class="btn overflow-hidden text-white rounded transition shadow-lg shadow-black/10 hover:cursor-pointer">
              <i class="bi bi-arrow-clockwise"></i>
              <span>Retry</span>
            </button>
          </template>
        </CardCollapsable>
        <button @click="fetchCommits" class="min-h-10.25 max-h-10.25 overflow-hidden text-white rounded transition shadow-lg shadow-black/10 hover:cursor-pointer">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
    </div>

    <div v-else-if="commits.length > 0" class="flex flex-col gap-2">
      <CardCollapsable v-for="item in commits" :key="item.sha" class="zyn-ov-brighter-200" border="1px solid var(--zyn-ov-brighter-200)">
        <template #header>
          <div class="flex">
            <div>
              <img v-if="item.author?.avatar_url" :src="item.author.avatar_url" alt="Avatar" class="min-w-6 min-h-6 max-w-6 max-h-6 rounded-full object-contain mr-2"/>
            </div>
            <strong class="grow line-clamp-1">
              {{ item.commit.message }}
            </strong>
            <Badge background="var(--zyn-ov-darker-500)" class="max-w-fit mr-7" @click="openExternal(item.html_url)">
              <span class="text-md">{{ item.sha.substring(0, 7) }}</span>
            </Badge>
          </div>
        </template>
        <template #content>
          <div class="flex flex-col gap-1">
            <span class="zyn-ov-darker-500 px-2 py-1   rounded">
              <strong>Commit: </strong> {{ item.sha }}
            </span>
            <span class="zyn-ov-darker-500 px-2 py-1 rounded">
              <strong>Commit Message: </strong>{{ item.commit.message }}
            </span>
            <div class="flex gap-1 mt-2">
              <span class="zyn-ov-darker-500 px-2 py-1 rounded flex">
                <img v-if="item.author?.avatar_url" :src="item.author.avatar_url" alt="Avatar" class="w-5 h-5 m-0.5 mr-2 rounded-full"/>
                <span class="mb-0.5 mr-0.5">
                  by
                  <strong>
                    {{ item.commit.author.name }}
                  </strong>
                </span>
              </span>
              <span class="zyn-ov-darker-500 px-2 py-1 rounded flex">
                {{ formatDate(item.commit.author.date) }}
              </span>
              <div class="grow flex justify-end">
                <button class="btn" @click="openExternal(item.html_url)">
                  <i class="bi bi-github"></i>
                  <span>View</span>
                </button>
              </div>
            </div>
          </div>
        </template>
      </CardCollapsable>
    </div>
    <div v-else>
      <div class="flex gap-2">
        <CardCollapsable class="bg-red-500/50 flex-1" border="1px solid var(--zyn-ov-brighter-200)">
          <template #header>
            Error
          </template>
          <template #content>
            Message: No commits found.
            <br><br>
            <button @click="fetchCommits" class="btn overflow-hidden text-white rounded transition shadow-lg shadow-black/10 hover:cursor-pointer">
              <i class="bi bi-arrow-clockwise"></i>
              <span>Retry</span>
            </button>
          </template>
        </CardCollapsable>
        <button @click="fetchCommits" class="min-h-10.25 max-h-10.25 overflow-hidden text-white rounded transition shadow-lg shadow-black/10 hover:cursor-pointer">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
    </div>
  </div>
  <a @click="openExternal('https://github.com/nerotvlive/nex-app/commits/master/')" class="rounded-xl p-4 py-2 text-center bg-zinc-800 hover:bg-zinc-700 shadow-lg cursor-pointer" style="border: 1px solid var(--zyn-ov-brighter-200)">
    <strong>
      View full commit history on GitHub
    </strong>
  </a>
</template>