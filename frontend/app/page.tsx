import RobotScene from "@/components/canvas/RobotScene";
import NavigationMenu from "@/components/ui/NavigationMenu";

export default function Home() {
    return (
        <main className="relative w-full h-screen bg-slate-950 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full z-0">
                <RobotScene />
            </div>
            <NavigationMenu />
        </main>
    );
}
