import { BotSchema } from "@/schema";
import { type NextPage } from "next";
import { zodResolver } from '@hookform/resolvers/zod';
import Head from 'next/head';
import { useState } from "react";
import { useForm } from 'react-hook-form';

const Setup: NextPage = () => {

    const [step, setStep] = useState(0);
    const [base, setBase] = useState(true);
    return (
        <>
            <Head>
                <title>Guardian Dashboard</title>
                <meta name="description" content="Dashboard for the guardian discord bot" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main>
                <div>
                    {base ? <div className="App">
                        <header className="App-header">
                            <p>
                                Welcome to the Guardian setup wizard!
                            </p>
                            <p>
                                To get started, press the button below
                            </p>
                            <button className="border-red-200 border bg-red-300" onClick={() => setBase(false)}>
                                Get Started
                            </button>
                        </header>
                    </div> : <div className="space-x-1 rounded-sm">
                        {components[step]}

                        {step === 0 ? <button className="border-red-200 border bg-red-300" onClick={() => setBase(true)}>
                            Back
                        </button> : <button className="border-red-200 border bg-red-300" onClick={() => setStep(step - 1)}>
                            Back
                        </button>}
                        {step === 9 ? <button className="border-red-200 border bg-red-300" disabled={true}>
                            Next
                        </button> : <button className="border-red-200 border bg-red-300" onClick={() => setStep(step + 1)}>
                            Next
                        </button>}
                    </div>}

                </div>
            </main>
        </>
    )
}

export default Setup


function BotSettings() {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(BotSchema)
    });

    const onSubmit = (data: any) => {
        console.log(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <ul>
                <li className="border border-red-500 p-5">
                    <input placeholder="Prefix" {...register("prefix")} />
                    {errors?.prefix && <span>{errors.root?.message}</span>}
                </li>
                <li className="border border-red-500 p-5">
                    <input placeholder="Console Channel ID"  {...register("console_channel")} />
                    {errors?.console_channel && <span>{errors.root?.message}</span>}
                </li>
                <li className="border border-red-500 p-5">
                    <input placeholder="Bot Token" {...register("bot_token")} />
                    {errors?.bot_token && <span>{errors.root?.message}</span>}
                </li>
                <li className="border border-red-500 p-5">
                    <input placeholder="Web Socket Port" {...register("ws_port")} />
                    {errors?.ws_port && <span>{errors.root?.message}</span>}
                </li>
                <li className="border border-red-500 p-5">
                    <input placeholder="Guild ID" {...register("guild_id")} />
                    {errors?.guild_id && <span>{errors.root?.message}</span>}
                </li>
                <li className="border border-red-500 p-5">
                    <input placeholder="Owner ID" {...register("owner_id")} />
                    {errors?.owner_id && <span>{errors.root?.message}</span>}
                </li>
                <button type="submit">Submit</button>
            </ul>
        </form>
    );
}


function JoinSettings() {
    return (
        <div className="App">
            <header className="App-header">
                <p>
                    Test 2
                </p>
            </header>
        </div>
    );
}

function AcceptSettings() {
    return (
        <div className="App">
            <header className="App-header">
                <p>
                    Test 3
                </p>
            </header>
        </div>
    );
}

function RoleSettings() {
    return (
        <div className="App">
            <header className="App-header">
                <p>
                    Test 4
                </p>
            </header>
        </div>
    );
}

function OwnerSettings() {
    return (
        <div className="App">
            <header className="App-header">
                <p>
                    Test 5
                </p>
            </header>
        </div>
    );
}

function ApplicationSettings() {
    return (
        <div className="App">
            <header className="App-header">
                <p>
                    Test 6
                </p>
            </header>
        </div>
    );
}

function InterviewSettings() {
    return (
        <div className="App">
            <header className="App-header">
                <p>
                    Test 7
                </p>
            </header>
        </div>
    );
}

function WhitelistManagerSettings() {
    return (
        <div className="App">
            <header className="App-header">
                <p>
                    Test 8
                </p>
            </header>
        </div>
    );
}

function ActivitySettings() {
    return (
        <div className="App">
            <header className="App-header">
                <p>
                    Test 9
                </p>
            </header>
        </div>
    );
}

function DatabaseSettings() {
    return (
        <div className="App">
            <header className="App-header">
                <p>
                    Test 10
                </p>
            </header>
        </div>
    );
}

const components = [
    <BotSettings />,
    <JoinSettings />,
    <AcceptSettings />,
    <RoleSettings />,
    <OwnerSettings />,
    <ApplicationSettings />,
    <InterviewSettings />,
    <WhitelistManagerSettings />,
    <ActivitySettings />,
    <DatabaseSettings />,
]

const bot = {
    prefix: "g!",
    console_channel: "id",
    bot_token: "token",
    ws_port: 8080,
    guild_id: "id",
    client_id: "id", // Make this auto generated,
    status: "online",
}

const join = {
    channel: "id",
    message: "Welcome to the server! To apply, click the button below.",
}

const accept = {
    channel: "id",
    message: "Welcome {member} to the server! You have been accepted."
}

const roles = {
    "member": "member",
}

const admins = [
    "id",
]

const applications = {
    enabled: true,
    channel: "id",
    questions: [
        "What is your name?",
    ]
}

const interviews = {
    enabled: true,
    notification: "Hi, an admin will be with you shortly. {member}",
    channel: "id",
    role: "id",
    private: true,
}

const whitelist_manager = {
    enabled: true,
}

const activity_manager = {
    enabled: true,
    message: "You have been removed from the whitelist due to inactivity. If you wish to rejoin, please reapply.",
    pardon_role: "id",
    remove_inactive_player_after_days: 30,
    grace_period: 7,
    timezone: "America/New_York",
    cron: "0 1 * * *"
}

const database = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    user: "root",
    password: "password",
    database: "guardian",
}

