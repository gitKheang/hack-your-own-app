import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScanResult } from "@/types";
import { SeverityBadge } from "@/components/domain/SeverityBadge";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Code, Lightbulb, ExternalLink, FileCode } from "lucide-react";

interface FindingCardProps {
  finding: ScanResult;
}

export const FindingCard = ({ finding }: FindingCardProps) => {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <SeverityBadge severity={finding.severity} />
              <Badge variant="outline">{finding.scan_type}</Badge>
            </div>
            <CardTitle className="text-lg">{finding.summary}</CardTitle>
            <CardDescription className="mt-1">
              Scanned at {new Date(finding.scanned_at).toLocaleString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Evidence */}
        {finding.evidence && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="evidence" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  <span className="font-medium">Evidence</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                {finding.evidence.request && (
                  <div>
                    <p className="text-sm font-medium mb-1">Request:</p>
                    <pre className="code-block">{finding.evidence.request}</pre>
                  </div>
                )}
                {finding.evidence.responseSnippet && (
                  <div>
                    <p className="text-sm font-medium mb-1">Response Snippet:</p>
                    <pre className="code-block">{finding.evidence.responseSnippet}</pre>
                  </div>
                )}
                {finding.evidence.affected && finding.evidence.affected.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Affected URLs:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {finding.evidence.affected.map((url, idx) => (
                        <li key={idx} className="text-muted-foreground font-mono">{url}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* AI Recommendations */}
        {finding.ai && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="ai" className="border rounded-lg px-4 bg-accent/30">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <span className="font-medium">AI Recommendations</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div>
                  <p className="text-sm font-medium mb-1">Impact:</p>
                  <p className="text-sm text-muted-foreground">{finding.ai.impact}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Recommendation:</p>
                  <p className="text-sm text-muted-foreground">{finding.ai.recommendation}</p>
                </div>
                {finding.ai.sampleFix && (
                  <div>
                    <p className="text-sm font-medium mb-1">Sample Fix:</p>
                    <pre className="code-block">{finding.ai.sampleFix}</pre>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 pt-2">
          {finding.cwe && (
            <Badge variant="outline" className="text-xs">
              <FileCode className="h-3 w-3 mr-1" />
              {finding.cwe}
            </Badge>
          )}
          {finding.owasp && (
            <Badge variant="outline" className="text-xs">
              OWASP {finding.owasp}
            </Badge>
          )}
        </div>

        {/* References */}
        {finding.references && finding.references.length > 0 && (
          <div className="pt-2">
            <p className="text-sm font-medium mb-2">References:</p>
            <div className="flex flex-wrap gap-2">
              {finding.references.map((ref, idx) => (
                <a
                  key={idx}
                  href={ref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  {new URL(ref).hostname}
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
