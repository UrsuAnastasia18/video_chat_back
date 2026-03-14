type AppRole = "STUDENT" | "TEACHER_ADMIN";

//in loc sa creez un array in principal sidebar de fiecare data
// sa creat aici un file aparte(constants) de unde va fi apelat in sidebar
export const sidebarLinks = [
    {
        label: 'Home',
        route: '/',
        imgUrl: '/icons/Home.svg',
    },
    {
        label: 'Upcoming',
        route: '/upcoming',
        imgUrl: '/icons/upcoming.svg',
    },
    {
        label: 'Previous',
        route: '/previous',
        imgUrl: '/icons/previous.svg',
    },
    {
        label: 'Recordings',
        route: '/recordings',
        imgUrl: '/icons/Video.svg',
    },
    {
        label: 'Personal Room',
        route: '/personal-room',
        imgUrl: '/icons/add-personal.svg',
    },
    {
        label: 'My Groups',
        route: '/teacher/groups',
        imgUrl: '/icons/groups.svg',
        roles: ['TEACHER_ADMIN'] as AppRole[],
    },
    {
        label: 'Books',
        route: '/teacher/books',
        imgUrl: '/icons/recordings.svg',
        roles: ['TEACHER_ADMIN'] as AppRole[],
    },
    {
        label: 'Worksheets',
        route: '/teacher/worksheets',
        imgUrl: '/icons/schedule.svg',
        roles: ['TEACHER_ADMIN'] as AppRole[],
    },
    {
        label: 'Grades',
        route: '/teacher/grades',
        imgUrl: '/icons/checked.svg',
        roles: ['TEACHER_ADMIN'] as AppRole[],
    },
    {
        label: 'My Group',
        route: '/student/group',
        imgUrl: '/icons/groups.svg',
        roles: ['STUDENT'] as AppRole[],
    },
    {
        label: 'My Books',
        route: '/student/books',
        imgUrl: '/icons/recordings.svg',
        roles: ['STUDENT'] as AppRole[],
    },
    {
        label: 'My Worksheets',
        route: '/student/worksheets',
        imgUrl: '/icons/schedule.svg',
        roles: ['STUDENT'] as AppRole[],
    },
    {
        label: 'My Grades',
        route: '/student/grades',
        imgUrl: '/icons/checked.svg',
        roles: ['STUDENT'] as AppRole[],
    },
]

export const avatarImages = [
    '/images/avatar-1.jpeg',
    '/images/avatar-2.jpeg',
    '/images/avatar-3.png',
    '/images/avatar-4.png',
    '/images/avatar-5.png',

]