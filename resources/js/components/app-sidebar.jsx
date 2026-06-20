import { NavMain } from '@/components/nav-main';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Link, usePage } from '@inertiajs/react';
import AppLogo from './app-logo';
import {
    LayoutGrid,
    Folder,
    ClipboardList,
    BookOpen,
    Settings,
    FileText,
    AlertTriangle,
    Users,
    History,
    Ticket,
    PlusCircle,
    List,
    HelpCircle,
    Network,
    Layers,
    Building,
    Star,
    Component,
} from 'lucide-react';

// 1. Diccionario de iconos (Igual que en el header de escritorio)
const ICONS = {
    LayoutGrid, Folder, ClipboardList, BookOpen, Settings, FileText,
    AlertTriangle, Users, History, Ticket, PlusCircle, List,
    HelpCircle, Network, Layers, Building, Star, Component,
};

export function AppSidebar() {
    // 2. Traemos la navegación perfecta que armamos en Laravel
    const { navigation = [] } = usePage().props;

    // 3. Formateamos la data del servidor para que el componente NavMain la entienda
    const formattedNavItems = navigation.map((item) => {
        return {
            title: item.title,
            url: item.url,
            icon: item.icon ? ICONS[item.icon] : null,
            // Dependiendo de cómo esté construido tu NavMain de Shadcn,
            // a veces usa "items" y a veces usa "children" para los submenús.
            // Mapeamos ambas por compatibilidad.
            items: item.items ? item.items.map(sub => ({
                title: sub.title,
                url: sub.url,
                icon: sub.icon ? ICONS[sub.icon] : null,
            })) : undefined,
            children: item.items ? item.items.map(sub => ({
                title: sub.title,
                url: sub.url,
                icon: sub.icon ? ICONS[sub.icon] : null,
            })) : undefined,
        };
    });

    return (
        <div className="md:hidden">
            <Sidebar collapsible="icon" variant="inset">
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild>
                                <Link href="/dashboard" prefetch>
                                    <AppLogo />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent>
                    {/* 4. Le pasamos la navegación dinámica */}
                    <NavMain items={formattedNavItems} />
                </SidebarContent>
            </Sidebar>
        </div>
    );
}
