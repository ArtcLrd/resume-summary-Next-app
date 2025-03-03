import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Candidate Application Portal</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Submit your application and join our team. We're looking for talented individuals to help us build the future.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Apply Now</CardTitle>
              <CardDescription>
                Submit your application to join our team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Fill out our application form with your details, resume, and experience.</p>
            </CardContent>
            <CardFooter>
              <Link href="/pages/application" className="w-full">
                <Button className="w-full">Apply Now</Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Admin Portal</CardTitle>
              <CardDescription>
                For recruiters and hiring managers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Access the admin portal to review and search through candidate applications.</p>
            </CardContent>
            <CardFooter>
              <Link href="/pages/admin" className="w-full">
                <Button variant="outline" className="w-full">Admin Login</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}