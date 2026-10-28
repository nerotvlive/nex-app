<script setup lang="ts">
  import DesktopTitlebar from "../components/shared/DesktopTitlebar.vue";
  import DesktopRootView from "../components/shared/DesktopRootView.vue";
  import DesktopPane from "../components/shared/DesktopPane.vue";
  import DesktopSideMenu from "../components/shared/DesktopSideMenu.vue";
  import Badge from "../components/shared/desktopelements/Badge.vue";
  import {computed, onMounted, ref} from 'vue'
  import {ZyneonSettings} from "../assets/zyneon/scripts";
  import {getApiStatus} from "../assets/zyneon/scripts";
  import {useI18n} from "vue-i18n";
  import { useRoute } from 'vue-router';
  import CardStructured from "../components/shared/desktopelements/CardStructured.vue";

  const notifications = ref(false);
  const friends = ref(false);
  const route = useRoute();
  const { t } = useI18n();

  const withNavigation = computed(() => {
    return (route.path !== '/' && route.path !== '/intro' && route.path !== '/loader');
  });

  const withTitlebar = computed(() => {
    return withNavigation.value && ZyneonSettings.isBorderless;
  });

  const showNotifications = () => {
    localStorage.setItem("nexapp.neo.settings.view.notifications", "true");
    ZyneonSettings.setMenuExpanded(false);
    hideFriends();
    notifications.value = true;
  }

  const showFriends = () => {
    localStorage.setItem("nexapp.neo.settings.view.friends", "true");
    ZyneonSettings.setMenuExpanded(false);
    hideNotifications();
    friends.value = true;
  }

  const hideNotifications = () => {
    localStorage.setItem("nexapp.neo.settings.view.notifications", "false");
    notifications.value = false;
  }

  const hideFriends = () => {
    localStorage.setItem("nexapp.neo.settings.view.friends", "false");
    friends.value = false;
  }

  const toggleNotifications = () => {
    if(notifications.value) {
      hideNotifications();
    } else {
      showNotifications();
    }
  }

  const toggleFriends = () => {
    if(friends.value) {
      hideFriends();
    } else {
      showFriends();
    }
  }

  window.showNotifications = showNotifications;
  window.showFriends = showFriends;
  window.hideNotifications = hideNotifications;
  window.hideFriends = hideFriends;
  window.toggleNotifications = toggleNotifications;
  window.toggleFriends = toggleFriends;

  onMounted(() => {
    ZyneonSettings.setClassicMenu(ZyneonSettings.useClassicMenu);
    ZyneonSettings.setBackgroundColor(ZyneonSettings.getBackgroundColor());
    ZyneonSettings.setBackgroundAccent(ZyneonSettings.getBackgroundAccent());
    ZyneonSettings.setRoundedCorners(false, ZyneonSettings.getRoundedCorners());
    ZyneonSettings.setBackgroundAccentOpacity(false, ZyneonSettings.getBackgroundAccentOpacity());
    ZyneonSettings.setSecondaryFrame(false);

    ZyneonSettings.setCanReloadMain(true);

    if (localStorage.getItem("nexapp.neo.settings.view.notifications") === "true") {
      showNotifications();
    }

    if (localStorage.getItem("nexapp.neo.settings.view.friends") === "true") {
      showFriends();
    }
  })

</script>

<template>
  <div class="zyneon-desktop zyn-background-body" id="main">
    <DesktopTitlebar class="zyneon-desktop-titlebar" id="titlebar" :class="withTitlebar ? '' : 'hidden'">
      <template #additional-buttons>
        <button @click="toggleFriends()" type="button" style="padding: 0 1rem; width: 40px;"><i class="bi" :class="friends && withNavigation ? 'bi-people-fill text-white' : 'bi-people'"/></button>
      </template>
      <template #start>
        <div class="w-full h-full gap-2 flex justify-start items-center">
          <img alt="" class="z-n1 h-4 ml-3" src="../assets/zyneon/img/nex-app-title.png">
        </div>
      </template>
      <template #title>
        <div class="hidden"/>
      </template>
      <template #end>
        <div class="w-full h-full gap-2 flex justify-end items-center pr-6">
          <Badge class="mr-10" background="var(--color-red-300)">
            <strong class="text-red-900">{{getApiStatus().version.number}}-{{getApiStatus().version.type}}.{{getApiStatus().version.build}}</strong>
          </Badge>
        </div>
      </template>
    </DesktopTitlebar>
    <DesktopRootView class="zyneon-desktop-view">
      <template #left>
       <DesktopSideMenu id="navigation" class="desktop-side-menu flex-col" :class="{'rounded-border': withTitlebar,'hidden': !withNavigation}">
         <template #top>
           <a class="zyn-btn compact transparent" @mousedown.stop @click="ZyneonSettings.toggleMenuExpanded">
             <i class="icon-text-align-justify"></i>
             <span class="grow">{{ t('menu.toggle') }}</span>
           </a>
         </template>
         <template #center>
           <div class="flex flex-col">
             <router-link to="/dashboard" id="dashboard-button" class="zyn-btn compact transparent" active-class="active" @mousedown.stop>
               <i class="icon-gallery-vertical-end"></i>
               <span class="grow">{{ t('menu.dashboard') }}</span>
             </router-link>
             <router-link to="/discover" id="discover-button" class="zyn-btn compact transparent" active-class="active" @mousedown.stop>
               <i class="icon-search"></i>
               <span class="grow">{{ t('menu.discover') }}</span>
             </router-link>
             <router-link to="/library" id="library-button" class="zyn-btn compact transparent" active-class="active" @mousedown.stop>
               <i class="icon-library"></i>
               <span class="grow">{{ t('menu.library') }}</span>
             </router-link>
           </div>
         </template>
         <template #bottom>
           <a @click="toggleFriends()" class="zyn-btn compact transparent" :class="{'active-alt': friends && withNavigation, 'hidden': withTitlebar || !withNavigation}" @mousedown.stop>
             <i class="bi" :class="friends ? 'bi-people-fill text-white' : 'bi-people'"></i>
             <span class="grow">{{ t('menu.friends') }}</span>
           </a>
           <a @click="toggleNotifications()" class="zyn-btn compact transparent" :class="{'active-alt': notifications && withNavigation}" @mousedown.stop>
             <i class="icon-bell"></i>
             <span class="grow">{{ t('menu.notifications') }}</span>
           </a>
           <hr class="opacity-20 mb-2" @mousedown.stop>
           <router-link to="/downloads" id="downloads-button" class="zyn-btn compact transparent" active-class="active" @mousedown.stop>
             <i class="icon-download"></i>
             <span class="grow">{{ t('menu.downloads') }}</span>
           </router-link>
           <router-link to="/settings" id="settings-button" class="zyn-btn compact transparent" active-class="active" @mousedown.stop>
             <i class="icon-bolt"></i>
             <span class="grow">{{ t('menu.settings') }}</span>
           </router-link>
         </template>
       </DesktopSideMenu>
      </template>
      <template #extra-left>
        <div class="h-full flex flex-col" :class="{'active': notifications && withNavigation, 'full': !withTitlebar}" id="notifications">
          <CardStructured class="mr-2 mb-2 grow notifications-card z-10" backgroundOverride="var(--zyn-background)">
            <template #header>
              <strong>{{ t('menu.notifications') }}</strong>
            </template>
          </CardStructured>
        </div>
      </template>
      <template #center>
        <DesktopPane class="zyneon-desktop-content" :class="{'rounded-border': withTitlebar,'border-none': !withNavigation,'friends': friends}">
          <div class="zyneon-desktop-content-background" />
          <div class="zyneon-desktop-content-pages">
            <router-view />
          </div>
        </DesktopPane>
      </template>
      <template #right>
        <div class="h-full flex flex-col" :class="{'active': friends && withNavigation, 'full': !withTitlebar}" id="friends">
          <CardStructured class="ml-2 mb-2 grow friends-card z-10" backgroundOverride="var(--zyn-background)">
            <template #header>
              <strong>{{ t('menu.friends') }}</strong>
            </template>
          </CardStructured>
        </div>
      </template>
    </DesktopRootView>
  </div>
</template>

<style scoped>
  body {
    #notifications, #friends {
      min-width: 0;
      max-width: 0;
      width: 0;
      overflow: hidden;
      transition: all 0.15s ease-in-out;
      opacity: 0;
      height: 100%;

      .notifications-card, .friends-card {
        border-radius: var(--zyn-br-lg);
      }

      .friends-card {
        margin: 0;
        border-radius: 0;
        border: none !important;
        border-top: 1px solid var(--zyn-ov-brighter-200) !important;
      }
    }

    #notifications.full, #friends.full {
      height: 100vh;

      .notifications-card, .friends-card {
        margin-top: 0.5rem;
      }
    }

    #friends.full, #notifications.full {
      .friends-card, .notifications-card {
        margin: 0;
        border-radius: 0;
        border: none !important;
      }

      .notifications-card {
        border-left: 1px solid var(--zyn-ov-brighter-200) !important;
      }
    }

    #notifications.active, #friends.active {
      min-width: 16rem;
      max-width: 16rem;
      width: 16rem;
      overflow: hidden;
      opacity: 1;
    }

    #friends.active.full {
      margin: 0;
    }

    .hidden {
      display: none !important;
    }

    .border-none {
      border: none !important;
    }

    .zyneon-desktop {
      position: absolute;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;

      .zyneon-desktop-view {

        .desktop-side-menu {
          height: 100vh;
          padding-top: 0.5rem;
        }

        .desktop-side-menu.rounded-border {
          height: 100%;
          padding-top: 0;
        }

        .zyneon-desktop-content {
          background: var(--zyn-background);
          width: 100%;
          height: 100vh;
          border-left: 1px solid var(--zyn-ov-brighter-200);
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 1rem #00000075;

          .zyneon-desktop-content-pages {
            position: absolute;
            height: 100%;
            width: 100%;
            overflow: hidden;
            overflow-y: auto;
            z-index: 2;
          }

          .zyneon-desktop-content-background {
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: 1;
            background: var(--zyn-background-app);
            overflow: hidden;
          }

          .zyneon-desktop-content-background::after {
            content: "";
            position: absolute;
            z-index: 0;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--zyn-background-body);
            opacity: 0.5;
          }
        }

        .zyneon-desktop-content.rounded-border {
          border-top-left-radius: var(--zyn-br-lg);
          border-top: 1px solid var(--zyn-ov-brighter-200);
          height: 100%;
        }

        .zyneon-desktop-content.friends {
          border-right: 1px solid var(--zyn-ov-brighter-200);
        }
      }
    }
  }

  body.classic-menu {
    .zyneon-desktop {
      .zyneon-desktop-view {
        .zyneon-desktop-content {
          box-shadow: inset 0.334rem 0.334rem 0.75rem black;
        }
      }
    }
  }
</style>
