import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AuthHeader from "@/components/AuthHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import type { UserCourseEnrollment as Enrollment } from "@/models/UserCourseEnrollment";
import { Label } from "@/components/ui/label";

export default function MyEnrollmentsPage() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEnrollments = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication required to view enrollments.");

            const response = await fetch("http://localhost:3000/api/my-enrollments", {
            headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
            throw new Error("Failed to fetch your enrolled courses.");
            }

            const data: Enrollment[] = await response.json();
            setEnrollments(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
        };

        fetchEnrollments();
    }, []);

    const renderContent = () => {
        if (isLoading) {
        return Array.from({ length: 3 }).map((_, index) => (
            <li key={index} className="rounded-lg border bg-card p-5 space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-3 w-full mt-2" />
            </li>
        ));
        }

        if (error) {
            return <p className="text-destructive text-center">{error}</p>;
        }

        if (enrollments.length === 0) {
            return (
                <div className="text-center rounded-lg border bg-card p-8">
                <h3 className="text-lg font-semibold">No Courses Yet</h3>
                <p className="mt-1 text-muted-foreground">You are not enrolled in any courses.</p>
                <Link to="/course-categories" className="mt-4 inline-block">
                    <Button>Browse Courses</Button>
                </Link>
                </div>
            );
        }

        return enrollments.map((enrollment) => (
            <li key={enrollment.enrollment_id} className="rounded-lg border bg-card p-5">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-xs font-semibold uppercase text-primary">{enrollment.category_name}</span>
                        <h2 className="text-xl font-semibold">{enrollment.title}</h2>
                    </div>
                    <Link to={`/course/${enrollment.course_id}/learn`}>
                        <Button variant="outline">
                            {enrollment.completion_status ? "Review Course" : "Continue Learning"}
                        </Button>
                    </Link>
                </div>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{enrollment.description}</p>
                <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                    <Label className="text-xs text-muted-foreground">Progress</Label>
                    <span className="text-xs font-semibold">{enrollment.progress_percentage}%</span>
                </div>
                <Progress value={enrollment.progress_percentage} className="h-2" />
                </div>
            </li>
        ));
    };

    return (
        <>
        <AuthHeader />
        <main className="mx-auto max-w-5xl px-4 py-8">
            <h1 className="text-3xl font-bold tracking-tight mb-6">My Courses</h1>
            <ul className="space-y-4">
            {renderContent()}
            </ul>
        </main>
        </>
    );
}