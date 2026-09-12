<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {openExternal} from "@/main";

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
const branch = 're'

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
  return new Date(dateString).toLocaleDateString('en-US', {
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
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-zinc-100">
        Changelog
        <span class="text-sm font-normal text-zinc-500">({{ owner }}/{{ repo }}@{{ branch }} commits)</span>
      </h2>
      <button @click="fetchCommits" class="flex text-xs gap-2 bg-zinc-500/25 hover:bg-zinc-400/25 text-white h-fit py-2 px-4 rounded transition shadow-black/25 hover:cursor-pointer">
        Refresh
      </button>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="animate-pulse flex items-center space-x-4 p-3">
        <div class="rounded-full bg-zinc-800 h-10 w-10"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-zinc-800 rounded w-3/4"></div>
          <div class="h-3 bg-zinc-800 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="p-4 bg-red-950/50 text-red-400 rounded-lg text-sm">
      {{ error }}
    </div>

    <div v-else-if="commits.length > 0" class="relative pl-6 border-l-2 border-zinc-700 space-y-8">
      <div v-for="item in commits" :key="item.sha" class="relative group bg-zinc-500/25 hover:bg-zinc-400/25 py-2 px-4 rounded transition hover:shadow-md shadow-black/25 hover:cursor-pointer" @click="openExternal(item.html_url)">
        <div class="absolute -left-7.75 top-1 w-3 h-3 bg-zinc-700 rounded-full border-2 border-zinc-900 group-hover:bg-indigo-600 transition-colors"></div>

        <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <a rel="noopener noreferrer" class="text-sm text-zinc-100 transition-colors">
            {{ item.commit.message }}
          </a>
          <span class="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded w-fit">
            {{ item.sha.substring(0, 7) }}
          </span>
        </div>

        <div class="flex items-center gap-2 mt-2 text-xs text-zinc-400">
          <img v-if="item.author?.avatar_url" :src="item.author.avatar_url" alt="Avatar" class="w-5 h-5 rounded-full"/>
          <span class="font-medium text-zinc-300">{{ item.commit.author.name }}</span>
          <span>•</span>
          <span>{{ formatDate(item.commit.author.date) }}</span>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8 text-zinc-400 text-sm">
      No commits found.
    </div>
  </div>
</template>