import React, { useState, useRef, useEffect } from 'react';
import { Briefcase, ExternalLink, GraduationCap, MapPin, Building, Target, IndianRupee, Upload, FileText, CheckCircle2, Star, Filter, Cpu, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Careers() {
    const [filterLocation, setFilterLocation] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [file, setFile] = useState<File | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);
    const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
    const [reviewsModal, setReviewsModal] = useState<{ company: string, rating: number, reviews: any[] } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const jobsPerPage = 10;
    const fileRef = useRef<HTMLInputElement>(null);

    // Generate 100 Mock Jobs Dynamically
    const generateMockJobs = () => {
        const roles = ['Software Engineering Intern', 'Junior Frontend Developer', 'Data Science Intern', 'Associate Cloud Engineer', 'Backend Developer', 'Full Stack Engineer', 'DevOps Engineer', 'UI/UX Designer', 'Product Manager Intern', 'Machine Learning Engineer', 'Cyber Security Analyst', 'Android Developer', 'iOS Developer', 'Data Engineer', 'Systems Engineer'];
        const companies = ['Microsoft', 'TechNova Solutions', 'Analytics India', 'Google Cloud', 'Zomato', 'Amazon', 'Flipkart', 'TCS', 'Infosys', 'Wipro', 'Accenture', 'Swiggy', 'Paytm', 'Meta', 'Netflix', 'Adobe', 'Cisco', 'IBM'];
        const locs = ['Bangalore', 'Pune', 'Remote', 'Hyderabad', 'Gurugram', 'Chennai', 'Noida'];
        const platforms = ['Careers', 'Naukri.com', 'Internshala', 'LinkedIn', 'Wellfound'];
        const types = ['Internship', 'Full Time', 'Contract'];
        const allSkills = ['React', 'JavaScript', 'Node.js', 'Python', 'C++', 'HTML', 'CSS', 'Tailwind', 'SQL', 'Data Analysis', 'Machine Learning', 'Pandas', 'Cloud', 'Linux', 'Networking', 'AWS', 'GCP', 'Express', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'Java', 'Go', 'Figma', 'TypeScript', 'GraphQL', 'Next.js', 'Spring Boot'];
        
        const colors = [
            { c: 'text-blue-600', b: 'bg-blue-50' },
            { c: 'text-purple-600', b: 'bg-purple-50' },
            { c: 'text-green-600', b: 'bg-green-50' },
            { c: 'text-indigo-600', b: 'bg-indigo-50' },
            { c: 'text-orange-600', b: 'bg-orange-50' },
            { c: 'text-pink-600', b: 'bg-pink-50' },
            { c: 'text-teal-600', b: 'bg-teal-50' }
        ];

        const mockJobs = [];
        for (let i = 0; i < 100; i++) {
            const role = roles[Math.floor(Math.random() * roles.length)];
            const company = companies[Math.floor(Math.random() * companies.length)];
            const loc = locs[Math.floor(Math.random() * locs.length)];
            const platform = platforms[Math.floor(Math.random() * platforms.length)];
            const type = types[Math.floor(Math.random() * types.length)];
            const colorPair = colors[Math.floor(Math.random() * colors.length)];
            
            // Random stipend based on type
            let stipend = '';
            let duration = '';
            if (type === 'Internship') {
                stipend = `₹${Math.floor(Math.random() * 40 + 10)},000 / month`;
                duration = `${Math.floor(Math.random() * 5 + 2)} Months`;
            } else if (type === 'Full Time') {
                stipend = `${Math.floor(Math.random() * 15 + 5)} - ${Math.floor(Math.random() * 15 + 20)} LPA`;
                duration = 'Permanent';
            } else {
                stipend = `₹${Math.floor(Math.random() * 80 + 30)},000 / month`;
                duration = '12 Months';
            }

            // Random skills (3 to 6)
            const jobSkills = [];
            const skillCount = Math.floor(Math.random() * 4) + 3;
            for (let j = 0; j < skillCount; j++) {
                const s = allSkills[Math.floor(Math.random() * allSkills.length)];
                if (!jobSkills.includes(s)) jobSkills.push(s);
            }

            // Random Rating
            const rating = (Math.random() * 1.5 + 3.5).toFixed(1); // 3.5 to 5.0

            // Random Reviews
            const reviews = [
                { author: 'Current Employee', text: `Great place to learn and grow. The ${role} team is very supportive.`, date: 'Recent' },
                { author: 'Former Intern', text: `Fast paced environment. Highly recommended for freshers.`, date: 'Last Month' }
            ];

            // Real URLs
            let link = '#';
            if (platform === 'LinkedIn') link = 'https://www.linkedin.com/jobs/';
            else if (platform === 'Naukri.com') link = 'https://www.naukri.com/';
            else if (platform === 'Internshala') link = 'https://internshala.com/';
            else if (platform === 'Wellfound') link = 'https://wellfound.com/jobs';
            else link = `https://careers.${company.toLowerCase().replace(/\s+/g, '')}.com/`;

            mockJobs.push({
                id: i,
                type,
                role,
                company,
                location: loc === 'Remote' ? 'Remote' : `${loc}, India`,
                locationCategory: loc,
                stipend,
                duration,
                link,
                platform,
                color: colorPair.c,
                bg: colorPair.b,
                rating: parseFloat(rating),
                skills: jobSkills,
                reviews
            });
        }
        return mockJobs;
    };

    // Use a ref or memo so it doesn't regenerate on every render
    const initialJobs = useRef(generateMockJobs()).current;

    const locations = ['All', 'Bangalore', 'Pune', 'Remote', 'Hyderabad', 'Gurugram', 'Chennai', 'Noida'];
    const jobTypes = ['All', 'Internship', 'Full Time', 'Contract'];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        
        if (selectedFile.type !== 'application/pdf') {
            alert('Please upload a PDF resume.');
            return;
        }

        setFile(selectedFile);
        setIsScanning(true);
        setScanComplete(false);
        setExtractedSkills([]);

        // Simulate AI Scanning Delay
        setTimeout(() => {
            setIsScanning(false);
            setScanComplete(true);
            // Simulate extracting relevant skills from a typical CS student resume
            setExtractedSkills(['React', 'JavaScript', 'Python', 'Node.js', 'HTML']);
        }, 2500);
    };

    const removeResume = () => {
        setFile(null);
        setScanComplete(false);
        setExtractedSkills([]);
        if (fileRef.current) fileRef.current.value = '';
    };

    // Calculate match scores and filter
    const processedJobs = initialJobs
        .filter(job => filterLocation === 'All' || job.locationCategory === filterLocation)
        .filter(job => filterType === 'All' || job.type === filterType)
        .map(job => {
            if (!scanComplete) return { ...job, matchScore: null };
            
            // Calculate how many of the job's skills match the extracted skills
            const matchCount = job.skills.filter(s => 
                extractedSkills.some(es => es.toLowerCase() === s.toLowerCase())
            ).length;
            
            const matchScore = Math.round((matchCount / job.skills.length) * 100);
            return { ...job, matchScore };
        })
        .sort((a, b) => {
            if (!scanComplete) return 0;
            return (b.matchScore || 0) - (a.matchScore || 0);
        });

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterLocation, filterType, scanComplete]);

    const totalPages = Math.ceil(processedJobs.length / jobsPerPage);
    const currentJobs = processedJobs.slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage);

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full opacity-50 -translate-y-16 translate-x-16 pointer-events-none" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <Briefcase className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Careers & Placements</h2>
                        </div>
                        <p className="text-gray-500 font-medium">Explore hand-picked internships and job opportunities.</p>
                    </div>
                </div>
            </div>

            {/* AI Resume Scanner Panel */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 rounded-xl p-6 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div>
                        <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-indigo-600" /> AI Resume Matcher
                        </h3>
                        <p className="text-sm text-indigo-700">Upload your PDF resume to instantly see which jobs match your skills.</p>
                    </div>
                    {file && (
                        <button onClick={removeResume} className="text-indigo-400 hover:text-red-500 transition" title="Remove Resume">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="relative z-10">
                    {!file ? (
                        <button 
                            onClick={() => fileRef.current?.click()}
                            className="w-full sm:w-auto bg-white border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50/50 text-indigo-600 font-semibold py-4 px-8 rounded-xl transition flex flex-col items-center justify-center gap-2"
                        >
                            <Upload className="w-6 h-6" />
                            <span>Click to upload Resume (PDF)</span>
                        </button>
                    ) : isScanning ? (
                        <div className="bg-white rounded-xl p-6 border border-indigo-200 flex flex-col items-center justify-center text-center space-y-3">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                            <p className="font-bold text-indigo-900">Scanning Document with AI...</p>
                            <p className="text-xs text-indigo-500">Extracting skills and matching profiles.</p>
                        </div>
                    ) : scanComplete ? (
                        <div className="bg-white rounded-xl p-5 border border-green-200 flex flex-col sm:flex-row items-center gap-6">
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{file.name}</p>
                                    <p className="text-xs text-green-600 font-semibold">Scan Complete • Skills Extracted</p>
                                </div>
                            </div>
                            <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-2">Detected Skills</p>
                                <div className="flex flex-wrap gap-2">
                                    {extractedSkills.map(s => (
                                        <span key={s} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : null}
                    <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                </div>
            </div>

            {/* Filters Section */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 text-gray-700 font-semibold shrink-0">
                    <Filter className="w-5 h-5" /> 
                    <span>Filter Jobs</span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full overflow-hidden">
                    {/* Location Filter */}
                    <div className="flex items-center gap-2 flex-1 overflow-x-auto pb-1 sm:pb-0">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 hidden sm:block">Location:</span>
                        <div className="flex gap-2">
                            {locations.map(loc => (
                                <button
                                    key={loc}
                                    onClick={() => setFilterLocation(loc)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                                        filterLocation === loc 
                                        ? 'bg-gray-800 text-white' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {loc}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-px bg-gray-200 hidden sm:block"></div>

                    {/* Type Filter */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 shrink-0">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 hidden sm:block">Type:</span>
                        <div className="flex gap-2">
                            {jobTypes.map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                                        filterType === type 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Job Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {currentJobs.length === 0 ? (
                    <div className="col-span-1 lg:col-span-2 bg-white py-12 rounded-xl border border-gray-200 text-center text-gray-500">
                        <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="font-semibold">No jobs found.</p>
                    </div>
                ) : (
                    currentJobs.map((job) => (
                        <div key={job.id} className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition p-6 flex flex-col justify-between ${job.matchScore !== null && job.matchScore > 50 ? 'border-green-300 ring-1 ring-green-100' : 'border-gray-200'}`}>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-2">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${job.bg} ${job.color}`}>
                                            {job.type}
                                        </span>
                                        {job.matchScore !== null && (
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide ${job.matchScore >= 80 ? 'bg-green-100 text-green-700' : job.matchScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {job.matchScore}% Match
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                        <Target className="w-3 h-3" /> {job.platform}
                                    </span>
                                </div>
                                
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{job.role}</h3>
                                <div className="flex items-center gap-3 mb-4">
                                    <p className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
                                        <Building className="w-4 h-4 text-gray-400" /> {job.company}
                                    </p>
                                    <button 
                                        onClick={() => setReviewsModal({ company: job.company, rating: job.rating, reviews: job.reviews })}
                                        className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 hover:bg-yellow-100 px-2 py-0.5 rounded-full border border-yellow-200 transition cursor-pointer"
                                        title="View Glassdoor Reviews"
                                    >
                                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> {job.rating}
                                    </button>
                                </div>

                                <div className="space-y-2 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span>{job.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <IndianRupee className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium text-gray-900">{job.stipend}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <GraduationCap className="w-4 h-4 text-gray-400" />
                                        <span>Duration: {job.duration}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 pt-1">
                                        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span className="text-xs text-gray-500 line-clamp-1" title={job.skills.join(', ')}>Skills: {job.skills.join(', ')}</span>
                                    </div>
                                </div>
                            </div>

                            <a 
                                href={job.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`w-full flex items-center justify-center gap-2 font-bold py-2.5 rounded-lg border transition ${job.matchScore !== null && job.matchScore > 70 ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700' : 'bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-200'}`}
                            >
                                Apply Now <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }).map((_, i) => {
                            const page = i + 1;
                            // Show first, last, current, and adjacent pages
                            if (
                                page === 1 || 
                                page === totalPages || 
                                Math.abs(currentPage - page) <= 1
                            ) {
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-10 h-10 rounded-lg text-sm font-bold transition ${
                                            currentPage === page 
                                            ? 'bg-indigo-600 text-white shadow-sm' 
                                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            } else if (
                                page === currentPage - 2 || 
                                page === currentPage + 2
                            ) {
                                return <span key={page} className="text-gray-400 px-1">...</span>;
                            }
                            return null;
                        })}
                    </div>

                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* TPO Banner */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center mt-8">
                <h4 className="text-lg font-bold text-indigo-900 mb-2">Need Placement Assistance?</h4>
                <p className="text-sm text-indigo-700 mb-4">Contact the college Training and Placement Cell (TPO) for resume reviews and mock interviews.</p>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition shadow">
                    Book TPO Session
                </button>
            </div>

            {/* Reviews Modal */}
            {reviewsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                    <Building className="w-5 h-5 text-gray-400" /> {reviewsModal.company}
                                </h3>
                                <div className="flex items-center gap-1 mt-1 text-sm font-bold text-yellow-600">
                                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> {reviewsModal.rating} out of 5
                                </div>
                            </div>
                            <button onClick={() => setReviewsModal(null)} className="text-gray-400 hover:text-gray-700 transition bg-white border border-gray-200 rounded-full p-1.5 hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <h4 className="text-sm font-extrabold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                Glassdoor Reviews
                            </h4>
                            <div className="space-y-4">
                                {reviewsModal.reviews.map((rev, i) => (
                                    <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-bold text-gray-900 text-sm">{rev.author}</p>
                                            <span className="text-xs font-semibold text-gray-400">{rev.date}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 italic">"{rev.text}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
