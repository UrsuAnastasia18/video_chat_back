type AppRole = "STUDENT" | "TEACHER_ADMIN";

//in loc sa creez un array in principal sidebar de fiecare data
// sa creat aici un file aparte(constants) de unde va fi apelat in sidebar
export const sidebarLinks = [
    {
        label: 'Acasă',
        route: '/',
        imgUrl: '/icons/Home.svg',
    },
    {
        label: 'Urmează',
        route: '/upcoming',
        imgUrl: '/icons/upcoming.svg',
    },
    {
        label: 'Anterioare',
        route: '/previous',
        imgUrl: '/icons/previous.svg',
    },
    {
        label: 'Înregistrări',
        route: '/recordings',
        imgUrl: '/icons/Video.svg',
    },
    {
        label: 'Camera personală',
        route: '/personal-room',
        imgUrl: '/icons/add-personal.svg',
    },
    {
        label: 'Grupele mele',
        route: '/teacher/groups',
        imgUrl: '/icons/groups.svg',
        roles: ['TEACHER_ADMIN'] as AppRole[],
    },
    {
        label: 'Cărți',
        route: '/teacher/books',
        imgUrl: '/icons/recordings.svg',
        roles: ['TEACHER_ADMIN'] as AppRole[],
    },
    {
        label: 'Fișe',
        route: '/teacher/worksheets',
        imgUrl: '/icons/schedule.svg',
        roles: ['TEACHER_ADMIN'] as AppRole[],
    },
    {
        label: 'Note',
        route: '/teacher/grades',
        imgUrl: '/icons/checked.svg',
        roles: ['TEACHER_ADMIN'] as AppRole[],
    },
    {
        label: 'Grupul meu',
        route: '/student/group',
        imgUrl: '/icons/groups.svg',
        roles: ['STUDENT'] as AppRole[],
    },
    {
        label: 'Cărțile mele',
        route: '/student/books',
        imgUrl: '/icons/recordings.svg',
        roles: ['STUDENT'] as AppRole[],
    },
    {
        label: 'Fișele mele',
        route: '/student/worksheets',
        imgUrl: '/icons/schedule.svg',
        roles: ['STUDENT'] as AppRole[],
    },
    {
        label: 'Lecțiile mele',
        route: '/student/lessons',
        imgUrl: '/icons/upcoming.svg',
        roles: ['STUDENT'] as AppRole[],
    },
    {
        label: 'Notele mele',
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
