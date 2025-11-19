<template>
  <!-- <ProfileCard
    name="jinming jiang"
    title="Software Engineer"
    handle="jinmingjiang"
    status="Online"
    contact-text="Contact Me"
    avatar-url="/assets/person.png"
    icon-url="/assets/iconpattern.png"
    grain-url="/assets/grain.webp"
    :show-user-info="true"
    :show-behind-gradient="true"
    :enable-tilt="true"
    @contact-click="handleContactClick"
  /> -->
  个人展示页面
</template>

<script setup lang="ts">
  import ProfileCard from "@/components/ProfileCard.vue";

  const handleContactClick = () => {
    console.log('Contact button clicked!');
  };
</script>