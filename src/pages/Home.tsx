import React from 'react';
import Navbar from '../layouts/Navbar';
import { Link } from 'react-router-dom';

const features = [
	{
		title: 'Smart Property Management',
		desc: 'Comprehensive oversight of estates, blocks, and units with real-time status tracking.',
		icon: '🏢',
	},
	{
		title: 'Tenant Portal',
		desc: 'Self-service platform for tenants to pay rent, submit complaints, and access documents.',
		icon: '👥',
	},
	{
		title: 'Financial Tracking',
		desc: 'Monitor payments, generate invoices, and track arrears with detailed financial reports.',
		icon: '💰',
	},
	{
		title: 'Maintenance Management',
		desc: 'Streamlined complaint handling with status updates and resolution tracking.',
		icon: '🔧',
	},
	{
		title: 'Analytics & Reports',
		desc: 'Data-driven insights on occupancy rates, revenue, and property performance.',
		icon: '📊',
	},
	{
		title: 'Multi-Role Access',
		desc: 'Tailored dashboards for property managers, owners, and tenants.',
		icon: '🔐',
	},
];

const stats = [
	{ number: '500+', label: 'Properties Managed' },
	{ number: '99.9%', label: 'System Uptime' },
	{ number: '24/7', label: 'Support Available' },
	{ number: '100%', label: 'Data Security' },
];

const testimonials = [
	{
		name: 'Sarah Johnson',
		quote: 'This platform transformed how we manage our 200+ unit portfolio. Everything is organized and accessible.',
		role: 'Property Manager',
		company: 'Urban Living Solutions',
	},
	{
		name: 'Michael Chen',
		quote: 'The tenant portal makes rent collection seamless. Our efficiency increased by 40%.',
		role: 'Estate Owner',
		company: 'Chen Properties',
	},
	{
		name: 'Emma Wilson',
		quote: 'Finally, a system where I can track maintenance requests and communicate directly with management.',
		role: 'Tenant',
		company: 'Resident',
	},
];

export default function Home() {
	return (
		<div className="min-h-screen bg-white">
			<Navbar />

			{/* Hero Section */}
			<section className="gradient-bg relative overflow-hidden">
				<div className="absolute inset-0 bg-blue-600/10"></div>
				<div className="container mx-auto px-6 lg:px-8 py-20 lg:py-32 relative">
					<div className="text-center max-w-4xl mx-auto">
						<div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-8">
							<span className="w-2 h-2 bg-white rounded-full mr-2"></span>
							Modern Property Management Platform
						</div>
						<h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight">
							Simplify Your Property
							<span className="block text-blue-100">Management</span>
						</h1>
						<p className="text-xl lg:text-2xl text-blue-100 mb-12 leading-relaxed max-w-3xl mx-auto">
							Streamline operations, enhance tenant satisfaction, and maximize property value with our comprehensive management platform.
						</p>
						<div className="flex flex-col sm:flex-row gap-6 justify-center">
							<Link
								to="/manager"
								className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-blue"
							>
								Start Managing Properties
							</Link>
							<Link
								to="/tenant"
								className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
							>
								Tenant Portal
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Stats Section */}
			<section className="py-16 bg-white border-b border-blue-100">
				<div className="container mx-auto px-6 lg:px-8">
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
						{stats.map((stat, index) => (
							<div key={index} className="text-center">
								<div className="text-4xl lg:text-5xl font-bold text-blue-600 mb-2">{stat.number}</div>
								<div className="text-gray-600 font-medium">{stat.label}</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="section-padding bg-white">
				<div className="container mx-auto px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-4xl lg:text-5xl font-bold text-gradient mb-6">Everything You Need</h2>
						<p className="text-xl text-gray-600 max-w-3xl mx-auto">
							From property oversight to tenant services, our platform provides all the tools to manage your real estate portfolio efficiently.
						</p>
					</div>
					<div className="grid lg:grid-cols-3 gap-8">
						{features.map((feature, index) => (
							<div
								key={index}
								className="group p-8 rounded-2xl bg-white border border-blue-100 hover:border-blue-300 shadow-blue hover:shadow-lg transition-all duration-300"
							>
								<div className="text-4xl mb-6">{feature.icon}</div>
								<h3 className="text-xl font-semibold text-blue-600 mb-4">{feature.title}</h3>
								<p className="text-gray-600 leading-relaxed">{feature.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Dashboard Preview Section */}
			<section className="section-padding bg-blue-50">
				<div className="container mx-auto px-6 lg:px-8">
					<div className="grid lg:grid-cols-2 gap-16 items-center">
						<div>
							<h2 className="text-4xl lg:text-5xl font-bold text-blue-600 mb-8">
								Intuitive Dashboard Design
							</h2>
							<p className="text-xl text-gray-600 mb-8 leading-relaxed">
								Get a complete overview of your properties with our clean, modern interface. Monitor key metrics, track payments, and manage tenants all from one central location.
							</p>
							<div className="space-y-4">
								<div className="flex items-center">
									<div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-4">
										<svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path
												fillRule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clipRule="evenodd"
											></path>
										</svg>
									</div>
									<span className="text-gray-700 font-medium">Real-time occupancy tracking</span>
								</div>
								<div className="flex items-center">
									<div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-4">
										<svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path
												fillRule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clipRule="evenodd"
											></path>
										</svg>
									</div>
									<span className="text-gray-700 font-medium">Automated payment reminders</span>
								</div>
								<div className="flex items-center">
									<div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-4">
										<svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path
												fillRule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clipRule="evenodd"
											></path>
										</svg>
									</div>
									<span className="text-gray-700 font-medium">Comprehensive reporting tools</span>
								</div>
							</div>
						</div>
						<div className="relative">
							<div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl shadow-blue flex items-center justify-center">
								<div className="text-blue-600 font-semibold text-lg">Dashboard Preview</div>
							</div>
							<div className="absolute -bottom-6 -left-6 w-32 h-24 bg-white rounded-lg shadow-blue border border-blue-100 flex items-center justify-center">
								<div className="text-blue-600 text-sm font-medium">Reports</div>
							</div>
							<div className="absolute -top-6 -right-6 w-36 h-28 bg-white rounded-lg shadow-blue border border-blue-100 flex items-center justify-center">
								<div className="text-blue-600 text-sm font-medium">Analytics</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section className="section-padding bg-white">
				<div className="container mx-auto px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-4xl lg:text-5xl font-bold text-blue-600 mb-6">
							Trusted by Property Professionals
						</h2>
						<p className="text-xl text-gray-600">See what our users have to say about their experience</p>
					</div>
					<div className="grid lg:grid-cols-3 gap-8">
						{testimonials.map((testimonial, index) => (
							<div key={index} className="p-8 bg-white rounded-2xl border border-blue-100 shadow-blue">
								<div className="flex mb-6">
									{[...Array(5)].map((_, i) => (
										<svg key={i} className="w-5 h-5 text-blue-400 fill-current" viewBox="0 0 20 20">
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
										</svg>
									))}
								</div>
								<p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.quote}"</p>
								<div>
									<div className="font-semibold text-blue-600">{testimonial.name}</div>
									<div className="text-gray-500 text-sm">{testimonial.role}</div>
									<div className="text-gray-400 text-sm">{testimonial.company}</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="gradient-bg py-20">
				<div className="container mx-auto px-6 lg:px-8 text-center">
					<h2 className="text-4xl lg:text-5xl font-bold text-white mb-8">Ready to Get Started?</h2>
					<p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
						Join hundreds of property managers who have streamlined their operations with our platform.
					</p>
					<div className="flex flex-col sm:flex-row gap-6 justify-center">
						<Link
							to="/manager"
							className="px-10 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-blue"
						>
							Start Free Trial
						</Link>
						<Link
							to="/owner"
							className="px-10 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
						>
							View Demo
						</Link>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-white border-t border-blue-100 py-8">
				<div className="container mx-auto px-6 lg:px-8 text-center">
					<p className="text-gray-600">
						&copy; {new Date().getFullYear()} Property Management System. All rights reserved.
					</p>
				</div>
			</footer>
		</div>
	);
}